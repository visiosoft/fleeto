/**
 * Billing actions shared by Stripe webhooks, staff-recorded payments and automatic card charges.
 */
const { col, audit } = require('./store');
const pay = require('./payments');
const { notifyLater } = require('./notify');
const extra = require('./charges');

const FIRST_STATUSES = ['approved', 'contract_pending', 'payment_pending'];
const DEAD_STATUSES = ['cancelled', 'rejected', 'expired'];

/** Create (once) the Stripe customer for a marketplace customer. */
async function ensureStripeCustomer(customer) {
  if (customer.stripeCustomerId) return customer.stripeCustomerId;
  const stripe = pay.getStripe();
  const sc = await stripe.customers.create(
    {
      name: customer.businessName || customer.fullName || undefined,
      phone: customer.phone || undefined,
      email: customer.email || undefined,
      metadata: { vanlyCustomerId: customer._id.toString() },
    },
    { idempotencyKey: `vanly-cust-${customer._id}` }
  );
  const customers = await col('customers');
  await customers.updateOne({ _id: customer._id }, { $set: { stripeCustomerId: sc.id } });
  return sc.id;
}

/** If the booking now meets its upfront requirement, move it to confirmed. Returns true if it changed. */
async function maybeConfirm(bookingId, by) {
  const bookings = await col('bookings');
  const booking = await bookings.findOne({ _id: bookingId });
  if (!booking || !FIRST_STATUSES.includes(booking.status) || !pay.readyToConfirm(booking)) return false;
  const now = new Date();
  await bookings.updateOne(
    { _id: bookingId, status: booking.status },
    { $set: { status: 'confirmed', updatedAt: now }, $push: { statusHistory: { status: 'confirmed', at: now, by, note: 'Payment terms met' } } }
  );
  return true;
}

/**
 * Record a successful payment for instalment n (idempotent).
 * @returns {Promise<'paid'|'already paid'|'needs refund'|'unknown instalment'>}
 */
async function applyPayment(booking, n, details) {
  const bookings = await col('bookings');
  const fresh = await bookings.findOne({ _id: booking._id });
  const schedule = pay.scheduleOf(fresh);
  const idx = schedule.findIndex((i) => i.n === n);
  if (idx === -1) return 'unknown instalment';
  const inst = schedule[idx];
  if (inst.status === 'paid') return 'already paid';

  const needsRefund = DEAD_STATUSES.includes(fresh.status);
  const now = new Date();
  const payments = await col('payments');
  const { insertedId: paymentId } = await payments.insertOne({
    bookingId: fresh._id.toString(),
    customerId: fresh.customerId,
    supplierOrgId: fresh.supplierOrgId,
    installment: n,
    label: pay.instLabel(inst),
    currency: 'aed',
    amount: details.amount ?? inst.total,
    expected: inst.total,
    lines: { rent: inst.rent, delivery: inst.delivery, vat: inst.vat, deposit: inst.deposit },
    method: details.method,
    reference: details.reference || '',
    paymentIntentId: details.paymentIntentId || null,
    stripeSessionId: details.stripeSessionId || null,
    stripeEventId: details.eventId || null,
    recordedBy: details.by,
    note: details.note || '',
    status: needsRefund ? 'needs_refund' : 'paid',
    createdAt: now,
  });

  const newSchedule = schedule.map((i, k) => (k === idx
    ? { ...i, status: 'paid', paidAt: now, paymentId: paymentId.toString(), method: details.method, paymentIntentId: details.paymentIntentId || null }
    : i));
  const set = { installments: newSchedule, updatedAt: now };
  if ((inst.extras || []).length) set.charges = extra.markPaid(fresh.charges, n, paymentId.toString());
  if (inst.deposit) {
    set.deposit = {
      amount: inst.deposit, status: 'held', refunded: 0, mode: 'charge', method: details.method,
      paymentIntentId: details.paymentIntentId || null, heldAt: now,
    };
  }
  await bookings.updateOne({ _id: fresh._id }, { $set: set });
  await audit(needsRefund ? 'payment.received_needs_refund' : 'payment.received', { by: details.by }, { bookingId: fresh._id, installment: n, method: details.method, amount: inst.total, paymentId });
  if (needsRefund) return 'needs refund';

  const confirmed = await maybeConfirm(fresh._id, details.by);
  const updated = await bookings.findOne({ _id: fresh._id });
  // Documents come after payment: tell a newly confirmed client to upload them if they haven't been approved yet.
  let docsNeeded = false;
  if (confirmed) {
    try {
      docsNeeded = !(await require('../../controllers/marketplace/documentController').documentsReady(updated)).ready;
    } catch (e) { docsNeeded = false; }
  }
  notifyLater(updated, 'payment_received', { label: pay.instLabel(inst), amount: inst.total, confirmed, docsNeeded, auto: details.method === 'card_auto' });
  return 'paid';
}

/**
 * Put every pending Salik / fine / other charge onto instalment n before collecting it.
 * Returns the fresh booking (unchanged if there was nothing to add).
 */
async function attachCharges(bookingId, n) {
  const bookings = await col('bookings');
  const b = await bookings.findOne({ _id: bookingId });
  const r = extra.attachPending(pay.scheduleOf(b), b.charges, n);
  if (!r) return b;
  await bookings.updateOne({ _id: bookingId }, { $set: { installments: r.installments, charges: r.charges, updatedAt: new Date() } });
  await audit('charges.attached', { system: 'billing' }, { bookingId, installment: n, count: r.added });
  return bookings.findOne({ _id: bookingId });
}

/** No rent left to collect but charges are pending: add a "Salik & fines" payment due today. */
async function billLeftoverCharges(bookingId, today) {
  const bookings = await col('bookings');
  const b = await bookings.findOne({ _id: bookingId });
  const schedule = pay.scheduleOf(b);
  if (schedule.some((i) => i.status !== 'paid')) return null;
  const r = extra.billLeftovers(schedule, b.charges, today);
  if (!r) return null;
  await bookings.updateOne({ _id: bookingId }, { $set: { installments: r.installments, charges: r.charges, updatedAt: new Date() } });
  await audit('charges.billed', { system: 'billing' }, { bookingId, count: r.added });
  return bookings.findOne({ _id: bookingId });
}

/** Save the card behind a Stripe payment method on the booking (and confirm if that was all that was missing). */
async function saveCard(booking, paymentMethodId, stripeCustomerId, by) {
  if (!paymentMethodId) return 'no payment method';
  const stripe = pay.getStripe();
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  const card = {
    paymentMethodId,
    stripeCustomerId: stripeCustomerId || pm.customer || null,
    brand: pm.card?.brand || 'card',
    last4: pm.card?.last4 || '',
    expMonth: pm.card?.exp_month || null,
    expYear: pm.card?.exp_year || null,
    savedAt: new Date(),
  };
  const bookings = await col('bookings');
  await bookings.updateOne({ _id: booking._id }, { $set: { card, updatedAt: new Date() } });
  await audit('card.saved', { by }, { bookingId: booking._id, brand: card.brand, last4: card.last4 });
  await maybeConfirm(booking._id, by);
  const updated = await bookings.findOne({ _id: booking._id });
  notifyLater(updated, 'card_saved', { brand: card.brand, last4: card.last4, auto: !!pay.termsOf(updated).autoCharge, cardDeposit: pay.termsOf(updated).depositMode === 'card_on_file' });
  return 'card saved';
}

function cardError(err) {
  const msg = err?.raw?.message || err?.message || 'Card charge failed';
  return { code: err?.code || err?.raw?.code || 'card_error', declineCode: err?.decline_code || err?.raw?.decline_code || null, message: msg };
}

async function recordAttempt(bookingId, n, attempt) {
  const bookings = await col('bookings');
  const b = await bookings.findOne({ _id: bookingId });
  const schedule = pay.scheduleOf(b).map((i) => (i.n === n ? { ...i, chargeAttempts: [...(i.chargeAttempts || []), attempt] } : i));
  await bookings.updateOne({ _id: bookingId }, { $set: { installments: schedule, updatedAt: new Date() } });
}

/**
 * Charge instalment n to the saved card without the client present.
 * @returns {Promise<{ ok: boolean, status: string, message?: string }>}
 */
async function chargeSavedCard(bookingIn, n, { by, auto = false, runDay = null }) {
  // Salik / fines first, so they are collected with this charge.
  const booking = await attachCharges(bookingIn._id, n);
  const schedule = pay.scheduleOf(booking);
  const i = schedule.find((x) => x.n === n);
  if (!i || i.status === 'paid') return { ok: false, status: 'nothing_due', message: 'Nothing to charge' };
  const card = booking.card;
  if (!card?.paymentMethodId || !card.stripeCustomerId) return { ok: false, status: 'no_card', message: 'No card saved for this booking' };

  const attemptNo = (i.chargeAttempts || []).length + 1;
  const stripe = pay.getStripe();
  const metadata = { bookingId: booking._id.toString(), installment: String(n), kind: 'off_session', reference: booking.reference };
  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: pay.toFils(i.total),
        currency: 'aed',
        customer: card.stripeCustomerId,
        payment_method: card.paymentMethodId,
        off_session: true,
        confirm: true,
        description: `${booking.reference} - ${pay.instLabel(i)}`,
        metadata,
      },
      { idempotencyKey: `vanly-${booking._id}-p${n}-off${attemptNo}` }
    );
    await recordAttempt(booking._id, n, { at: new Date(), runDay, by, auto, status: pi.status, paymentIntentId: pi.id });
    if (pi.status === 'succeeded') {
      await applyPayment(booking, n, { method: auto ? 'card_auto' : 'card_charged', paymentIntentId: pi.id, reference: `${card.brand} ${card.last4}`, by, amount: i.total });
      return { ok: true, status: 'paid' };
    }
    return { ok: true, status: pi.status, message: 'Charge is processing; it is confirmed by Stripe shortly.' };
  } catch (err) {
    const e = cardError(err);
    await recordAttempt(booking._id, n, { at: new Date(), runDay, by, auto, status: 'failed', error: e.message, code: e.code, declineCode: e.declineCode });
    await audit('payment.card_charge_failed', { by }, { bookingId: booking._id, installment: n, ...e });
    notifyLater(booking, 'payment_failed', { label: pay.instLabel(i), amount: i.total, last4: card.last4 });
    return { ok: false, status: 'failed', message: e.message };
  }
}

/**
 * Card-on-file deposit: charge an agreed deduction (damage, fuel, fines) or release the guarantee (amount 0).
 */
async function settleCardDeposit(booking, amount, note, by) {
  const terms = pay.termsOf(booking);
  if (terms.depositMode !== 'card_on_file') throw Object.assign(new Error('This booking\'s deposit was charged upfront - use refund instead.'), { status: 409 });
  if (booking.deposit && ['settled_with_deductions', 'released'].includes(booking.deposit.status)) {
    throw Object.assign(new Error('The deposit is already settled.'), { status: 409 });
  }
  const max = booking.quote?.lines?.deposit || 0;
  if (!(amount >= 0 && amount <= max)) throw Object.assign(new Error(`Deduction must be between 0 and AED ${max} (the agreed deposit)`), { status: 400 });
  if (amount > 0 && (!note || note.length < 5)) throw Object.assign(new Error('Explain the deduction (damage, fuel, fines)'), { status: 400 });

  let paymentIntentId = null;
  if (amount > 0) {
    const card = booking.card;
    if (!card?.paymentMethodId) throw Object.assign(new Error('No card saved for this booking.'), { status: 409 });
    const stripe = pay.getStripe();
    try {
      const pi = await stripe.paymentIntents.create(
        {
          amount: pay.toFils(amount), currency: 'aed', customer: card.stripeCustomerId, payment_method: card.paymentMethodId,
          off_session: true, confirm: true, description: `${booking.reference} - deposit deduction: ${note}`.slice(0, 300),
          metadata: { bookingId: booking._id.toString(), kind: 'deposit_deduction', reference: booking.reference },
        },
        { idempotencyKey: `vanly-dep-${booking._id}-ded-${pay.toFils(amount)}` }
      );
      paymentIntentId = pi.id;
    } catch (err) {
      const e = cardError(err);
      await audit('deposit.deduction_failed', { by }, { bookingId: booking._id, amount, ...e });
      throw Object.assign(new Error(`Card charge failed: ${e.message}`), { status: 402, code: 'CARD_DECLINED' });
    }
    const payments = await col('payments');
    await payments.insertOne({
      bookingId: booking._id.toString(), customerId: booking.customerId, supplierOrgId: booking.supplierOrgId,
      installment: null, label: 'Deposit deduction', currency: 'aed', amount, method: 'card_charged',
      paymentIntentId, note, recordedBy: by, status: 'paid', createdAt: new Date(),
    });
  }
  const deposit = {
    amount: max, mode: 'card_on_file', status: amount > 0 ? 'settled_with_deductions' : 'released',
    deductions: amount, refunded: pay.round2(max - amount), deductionNote: note || '', paymentIntentId, settledAt: new Date(),
  };
  const bookings = await col('bookings');
  await bookings.updateOne({ _id: booking._id }, { $set: { deposit, updatedAt: new Date() } });
  await audit('deposit.card_settled', { by }, { bookingId: booking._id, deductions: amount, note });
  notifyLater(booking, amount > 0 ? 'deposit_deducted' : 'deposit_released', { deductions: amount, note, last4: booking.card?.last4 });
  return deposit;
}

module.exports = { ensureStripeCustomer, maybeConfirm, applyPayment, saveCard, chargeSavedCard, settleCardDeposit, attachCharges, billLeftoverCharges, FIRST_STATUSES };
