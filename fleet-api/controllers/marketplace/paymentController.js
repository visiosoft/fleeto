/**
 * Stripe payments for marketplace bookings.
 *
 * Client side (Stripe Checkout, opened from the app):
 *   POST /bookings/:id/checkout  - pays what is due now. Depending on the booking's payment terms that is
 *                                  the upfront instalment (month 1 / deposit), a later month, or - when only
 *                                  a card is needed - a card-setup page. Cards are saved for off-session use
 *                                  when the terms need one (auto-charge or card-on-file deposit).
 *   POST /bookings/:id/card      - add or replace the saved card.
 * Stripe side:
 *   POST /stripe/webhook         - the only place card payments / saved cards become real.
 * Staff side:
 *   POST  /admin/bookings/:id/charge-card     - charge the next due instalment to the saved card now
 *   POST  /admin/bookings/:id/deposit/refund  - refund a charged deposit (Stripe or offline)
 *   POST  /admin/bookings/:id/deposit/card    - card-on-file deposit: charge a deduction or release it
 *   PATCH /admin/bookings/:id/terms           - change payment terms before anything is paid
 */
const { col, audit } = require('../../services/marketplace/store');
const pay = require('../../services/marketplace/payments');
const billing = require('../../services/marketplace/billing');
const { toId, HttpError, handle } = require('../../services/marketplace/util');
const { findOwnBooking, publicBooking } = require('./bookingController');
const { notifyLater } = require('../../services/marketplace/notify');
const extra = require('../../services/marketplace/charges');
const hold = require('../../services/marketplace/depositHold');

const LIVE_STATUSES = ['confirmed', 'handover_pending', 'active', 'overdue', 'return_pending', 'inspection_pending'];
const PAY_EARLY_DAYS = 7;
const SESSION_TTL_MIN = 60;
const REFUNDABLE_STATUSES = ['inspection_pending', 'closed', 'cancelled', 'rejected'];

function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function todayDubai() {
  return new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
}

function daysUntil(ymd) {
  return Math.round((new Date(`${ymd}T00:00:00Z`) - new Date(`${todayDubai()}T00:00:00Z`)) / 864e5);
}

function consentText(booking, terms) {
  const supplier = booking.listingSnapshot?.supplierName || 'the rental provider';
  const parts = [];
  if (terms.autoCharge) parts.push('monthly rent on each due date');
  if (terms.depositMode === 'card_on_file') parts.push(`agreed deductions from the AED ${booking.quote?.lines?.deposit || 0} security deposit`);
  return `I authorise ${supplier} to save this card and charge it for ${parts.join(' and ')} under rental agreement ${booking.reference}.`;
}

/** Decide what the client should do now: pay instalment n (and maybe save card) or just save a card. */
function nextAction(booking) {
  const terms = pay.termsOf(booking);
  const schedule = pay.scheduleOf(booking);
  const cardMissing = pay.needsCard(terms) && !booking.card?.paymentMethodId;

  if (booking.status === 'payment_pending') {
    const upfront = schedule.find((i) => i.upfront && i.status !== 'paid');
    if (upfront) return { kind: 'pay', inst: upfront, saveCard: cardMissing };
    if (cardMissing) return { kind: 'card' };
    return { kind: 'none', message: 'Nothing is due right now.' };
  }
  if (LIVE_STATUSES.includes(booking.status) || (['closed', 'disputed'].includes(booking.status) && schedule.some((i) => i.kind === 'extras' && i.status !== 'paid'))) {
    const next = schedule.find((i) => i.status !== 'paid');
    if (!next) return { kind: 'none', message: 'This booking is fully paid.' };
    if (daysUntil(next.dueDate) > PAY_EARLY_DAYS) {
      return { kind: 'none', code: 'NOT_DUE_YET', message: `Your next payment opens 7 days before ${next.dueDate}.` };
    }
    return { kind: 'pay', inst: next, saveCard: cardMissing && terms.autoCharge };
  }
  return { kind: 'none', code: 'NOT_PAYABLE_YET', message: 'Payment opens once your documents are approved and the agreement is ready.' };
}

async function createSession(req, booking, { inst, saveCard, setupOnly }) {
  const stripe = pay.getStripe();
  const terms = pay.termsOf(booking);
  const bookingId = booking._id.toString();
  const base = baseUrl(req);
  const customers = await col('customers');
  const customer = await customers.findOne({ _id: toId(booking.customerId) });
  const stripeCustomerId = await billing.ensureStripeCustomer(customer);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MIN * 60e3);
  const purpose = setupOnly ? 'card' : 'payment';
  const metadata = { bookingId, installment: inst ? String(inst.n) : '', purpose, saveCard: saveCard || setupOnly ? 'yes' : 'no', customerId: booking.customerId, reference: booking.reference };
  const common = {
    customer: stripeCustomerId,
    client_reference_id: bookingId,
    metadata,
    success_url: `${base}/api/marketplace/checkout/return?result=success&booking=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/api/marketplace/checkout/return?result=cancelled&booking=${bookingId}`,
    expires_at: Math.floor(expiresAt.getTime() / 1000),
  };
  const attempt = (booking.checkoutAttempts || 0) + 1;
  let session;
  if (setupOnly) {
    session = await stripe.checkout.sessions.create(
      { ...common, mode: 'setup', currency: 'aed', setup_intent_data: { metadata }, custom_text: { submit: { message: consentText(booking, terms) } } },
      { idempotencyKey: `vanly-${bookingId}-card-a${attempt}` }
    );
  } else {
    session = await stripe.checkout.sessions.create(
      {
        ...common,
        mode: 'payment',
        line_items: pay.lineItems(booking, inst),
        payment_intent_data: {
          metadata,
          description: `${booking.reference} - ${booking.listingSnapshot?.title || 'Van rental'} - ${pay.instLabel(inst)}`,
          ...(saveCard ? { setup_future_usage: 'off_session' } : {}),
        },
        ...(saveCard ? { custom_text: { submit: { message: consentText(booking, terms) } } } : {}),
      },
      { idempotencyKey: `vanly-${bookingId}-p${inst.n}-a${attempt}` }
    );
  }

  const bookings = await col('bookings');
  const set = { checkoutAttempts: attempt, openSession: { id: session.id, purpose, n: inst?.n || null, expiresAt }, updatedAt: new Date() };
  if (!Array.isArray(booking.installments) || !booking.installments.length) set.installments = pay.scheduleOf(booking);
  await bookings.updateOne({ _id: booking._id }, { $set: set });
  await audit('payment.checkout_started', { customerId: booking.customerId }, { bookingId, purpose, installment: inst?.n || null, sessionId: session.id });
  return session;
}

async function reuseOpenSession(booking, purpose, n) {
  const open = booking.openSession;
  if (!open || open.purpose !== purpose || (open.n || null) !== (n || null)) return null;
  if (!open.expiresAt || new Date(open.expiresAt) <= new Date(Date.now() + 2 * 60e3)) return null;
  try {
    const s = await pay.getStripe().checkout.sessions.retrieve(open.id);
    return s.status === 'open' && s.url ? s : null;
  } catch {
    return null;
  }
}

/** POST /bookings/:id/checkout -> { url, purpose, installment, total } */
exports.createCheckout = handle(async (req, res) => {
  let booking = await findOwnBooking(req);
  // Rent all paid but Salik / fines pending: let the client pay them now.
  if (nextAction(booking).kind === 'none' && (booking.charges || []).some((c) => c.status === 'pending')
    && [...LIVE_STATUSES, 'closed', 'disputed'].includes(booking.status) && !pay.scheduleOf(booking).some((i) => i.status !== 'paid')) {
    booking = (await billing.billLeftoverCharges(booking._id, todayDubai())) || booking;
  }
  let action = nextAction(booking);
  if (action.kind === 'none') throw new HttpError(409, action.message, action.code || 'NOTHING_DUE');
  const purpose = action.kind === 'card' ? 'card' : 'payment';
  const n = action.inst?.n || null;
  let session = await reuseOpenSession(booking, purpose, n);
  if (!session) {
    if (action.kind === 'pay' && !action.inst.upfront) {
      // Add any pending Salik / fines to this payment before opening the page.
      booking = await billing.attachCharges(booking._id, n);
      action = { ...action, inst: pay.scheduleOf(booking).find((i) => i.n === n) };
    }
    session = await createSession(req, booking, { inst: action.inst, saveCard: action.saveCard, setupOnly: action.kind === 'card' });
  }
  res.json({ status: 'success', data: { url: session.url, purpose, installment: n, total: action.inst?.total || 0 } });
});

/** POST /bookings/:id/card -> { url } (add / replace the saved card) */
exports.addCard = handle(async (req, res) => {
  const booking = await findOwnBooking(req);
  if (!pay.needsCard(pay.termsOf(booking))) throw new HttpError(409, 'This booking does not use a saved card.', 'CARD_NOT_USED');
  if (!['payment_pending', ...LIVE_STATUSES].includes(booking.status)) throw new HttpError(409, 'Cards can be added once the booking is approved.', 'NOT_PAYABLE_YET');
  const session = (await reuseOpenSession(booking, 'card', null)) || (await createSession(req, booking, { setupOnly: true }));
  res.json({ status: 'success', data: { url: session.url, purpose: 'card' } });
});

async function paymentMethodOf(stripe, session) {
  if (session.mode === 'setup' && session.setup_intent) {
    const si = typeof session.setup_intent === 'string' ? await stripe.setupIntents.retrieve(session.setup_intent) : session.setup_intent;
    return typeof si.payment_method === 'string' ? si.payment_method : si.payment_method?.id;
  }
  if (session.payment_intent) {
    const pi = typeof session.payment_intent === 'string' ? await stripe.paymentIntents.retrieve(session.payment_intent) : session.payment_intent;
    if (!pi) return null; // nothing to save; the payment itself is already recorded
    return typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id;
  }
  return null;
}

async function handleSessionCompleted(session, eventId) {
  const bookingId = toId(session.metadata?.bookingId);
  if (!bookingId) return 'ignored: no booking metadata';
  const bookings = await col('bookings');
  const booking = await bookings.findOne({ _id: bookingId });
  if (!booking) return 'ignored: booking not found';
  const stripe = pay.getStripe();
  const outcomes = [];

  if (session.mode === 'payment') {
    if (session.payment_status !== 'paid') return 'ignored'; // e.g. bank transfer still pending
    const n = Number(session.metadata?.installment);
    const inst = pay.scheduleOf(booking).find((i) => i.n === n);
    if (!inst) return 'ignored: unknown instalment';
    if (session.currency !== 'aed' || session.amount_total !== pay.toFils(inst.total)) {
      const payments = await col('payments');
      await payments.insertOne({ bookingId: bookingId.toString(), installment: n, amount: (session.amount_total || 0) / 100, expected: inst.total, stripeSessionId: session.id, stripeEventId: eventId, status: 'amount_mismatch', createdAt: new Date() });
      await audit('payment.amount_mismatch', { system: 'stripe' }, { bookingId, installment: n, got: session.amount_total, expected: pay.toFils(inst.total) });
      return 'amount mismatch';
    }
    const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
    outcomes.push(await billing.applyPayment(booking, n, { method: 'card_online', paymentIntentId: piId, stripeSessionId: session.id, eventId, by: 'stripe', amount: inst.total }));
  }

  if (session.metadata?.saveCard === 'yes' || session.mode === 'setup') {
    const pmId = await paymentMethodOf(stripe, session);
    outcomes.push(await billing.saveCard(booking, pmId, typeof session.customer === 'string' ? session.customer : session.customer?.id, 'stripe'));
  }
  await bookings.updateOne({ _id: bookingId, 'openSession.id': session.id }, { $set: { openSession: null } });
  return outcomes.join(', ') || 'nothing to do';
}

/** Off-session charges that finish asynchronously. */
async function handleIntent(event, eventId) {
  const pi = event.data.object;
  if (pi.metadata?.kind !== 'off_session') return 'ignored';
  const bookingId = toId(pi.metadata.bookingId);
  const bookings = await col('bookings');
  const booking = bookingId ? await bookings.findOne({ _id: bookingId }) : null;
  if (!booking) return 'ignored: booking not found';
  const n = Number(pi.metadata.installment);
  if (event.type === 'payment_intent.succeeded') {
    return billing.applyPayment(booking, n, { method: 'card_auto', paymentIntentId: pi.id, eventId, by: 'stripe', amount: pi.amount / 100 });
  }
  return 'failure recorded at charge time';
}

/** POST /stripe/webhook (raw body, Stripe-Signature verified). */
exports.webhook = async (req, res) => {
  const secret = pay.webhookSecret();
  if (!secret) return res.status(503).json({ error: 'Stripe webhook secret not configured' });
  if (!req.rawBody) return res.status(400).json({ error: 'Raw body unavailable' });

  let event;
  try {
    // eslint-disable-next-line global-require
    event = require('stripe').webhooks.constructEvent(req.rawBody, req.header('stripe-signature'), secret);
  } catch (err) {
    return res.status(400).json({ error: `Signature verification failed: ${err.message}` });
  }

  try {
    const events = await col('stripeEvents');
    if (await events.findOne({ _id: event.id })) return res.json({ received: true, duplicate: true });

    let outcome = 'ignored';
    const obj = event.data?.object;
    if (event.type === 'checkout.session.completed') outcome = await handleSessionCompleted(obj, event.id);
    else if (event.type === 'checkout.session.async_payment_succeeded') outcome = await handleSessionCompleted({ ...obj, payment_status: 'paid' }, event.id);
    else if (['checkout.session.expired', 'checkout.session.async_payment_failed'].includes(event.type)) {
      const bookingId = toId(obj.metadata?.bookingId);
      if (bookingId) await (await col('bookings')).updateOne({ _id: bookingId, 'openSession.id': obj.id }, { $set: { openSession: null } });
      outcome = 'session cleared';
    } else if (['payment_intent.succeeded', 'payment_intent.payment_failed'].includes(event.type)) {
      outcome = await handleIntent(event, event.id);
    }

    try {
      await events.insertOne({ _id: event.id, type: event.type, outcome, createdAt: new Date() });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
    res.json({ received: true, outcome });
  } catch (err) {
    console.error('[marketplace] stripe webhook error', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/** GET /checkout/return - shown in the browser after Stripe; informational only. */
exports.returnPage = (req, res) => {
  const ok = req.query.result === 'success';
  const bookingId = /^[a-f0-9]{24}$/.test(req.query.booking || '') ? req.query.booking : '';
  const deepLink = `vanly://booking/${bookingId}`;
  res.set('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>VANLY payment</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#EDF5E5;color:#18241C;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}
.c{background:#fff;border-radius:24px;padding:32px 24px;max-width:380px;width:100%;text-align:center;box-shadow:0 12px 40px #1b3b1c14}
.l{font-weight:850;font-size:28px;letter-spacing:-1.5px}.l b{color:#83B845}h1{font-size:22px;margin:22px 0 8px}p{color:#697269;font-size:14px;line-height:1.5}
a{display:block;margin-top:22px;background:#B9EF70;color:#18241C;text-decoration:none;font-weight:700;padding:14px;border-radius:14px}</style></head>
<body><div class="c"><div class="l">vanly<b>.</b></div>
<h1>${ok ? 'All done' : 'Cancelled'}</h1>
<p>${ok ? 'Thanks! We are confirming with the bank. Your booking updates in the app within a minute.' : 'Nothing was charged or saved. You can try again from your booking in the app.'}</p>
<a href="${deepLink}">Back to VANLY</a></div></body></html>`);
};

// ---------------- staff ----------------

async function staffBooking(req) {
  const orgId = req.user?.companyId?.toString();
  if (!orgId) throw new HttpError(403, 'Company account required');
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Booking not found');
  const bookings = await col('bookings');
  const booking = await bookings.findOne({ _id, supplierOrgId: orgId });
  if (!booking) throw new HttpError(404, 'Booking not found');
  return booking;
}

async function respond(res, bookingId) {
  const { staffBooking: shape, loadCustomer } = require('./adminBookingController'); // lazy: avoids a require cycle
  const bookings = await col('bookings');
  const b = await bookings.findOne({ _id: bookingId });
  res.json({ status: 'success', data: { booking: shape(b, await loadCustomer(b.customerId)) } });
}

/** PATCH /admin/bookings/:id/terms { rentTiming?, depositMode?, autoCharge? } */
exports.setTerms = handle(async (req, res) => {
  const booking = await staffBooking(req);
  const schedule = pay.scheduleOf(booking);
  const current = pay.termsOf(booking);
  let terms;
  try {
    terms = pay.normalizeTerms(req.body || {}, current);
  } catch (err) {
    throw new HttpError(400, err.message);
  }
  const structural = terms.rentTiming !== current.rentTiming || terms.depositMode !== current.depositMode;
  if (structural && schedule.some((i) => i.status === 'paid')) {
    throw new HttpError(409, 'Payments have already been taken - only auto-charge can be changed now.', 'TERMS_LOCKED');
  }
  if (structural && ['closed', 'cancelled', 'rejected', 'expired'].includes(booking.status)) throw new HttpError(409, 'This booking is finished.');
  const set = { paymentTerms: terms, updatedAt: new Date() };
  if (structural) set.installments = pay.buildSchedule(booking.quote, terms);
  const bookings = await col('bookings');
  await bookings.updateOne({ _id: booking._id }, { $set: set });
  await audit('booking.terms_changed', { userId: req.user.userId }, { bookingId: booking._id, from: current, to: terms });
  await billing.maybeConfirm(booking._id, `staff:${req.user.userId}`);
  await respond(res, booking._id);
});

/** POST /admin/bookings/:id/charge-card - charge the next due instalment to the saved card now. */
exports.chargeCard = handle(async (req, res) => {
  const booking = await staffBooking(req);
  if (!['payment_pending', ...LIVE_STATUSES].includes(booking.status)) throw new HttpError(409, `Cannot charge a ${booking.status} booking.`);
  const next = pay.scheduleOf(booking).find((i) => i.status !== 'paid');
  if (!next) throw new HttpError(409, 'Nothing is due.', 'NOTHING_DUE');
  if (!next.upfront && booking.status === 'payment_pending') throw new HttpError(409, 'Confirm the booking first.');
  const r = await billing.chargeSavedCard(booking, next.n, { by: `staff:${req.user.userId}`, auto: false });
  if (!r.ok) throw new HttpError(r.status === 'failed' ? 402 : 409, r.message, r.status === 'failed' ? 'CARD_DECLINED' : r.status.toUpperCase());
  await respond(res, booking._id);
});

/** POST /admin/bookings/:id/deposit/card { amount, note } - card-on-file deposit: deduct (amount>0) or release (0). */
exports.settleCardDeposit = handle(async (req, res) => {
  const booking = await staffBooking(req);
  if (!REFUNDABLE_STATUSES.includes(booking.status)) throw new HttpError(409, 'Settle the deposit after the return inspection (or a cancellation).', 'NOT_REFUNDABLE_YET');
  checkHold(booking, req);
  const amount = pay.round2(Number(req.body?.amount || 0));
  let note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : '';
  const { coverFromDeposit } = require('./chargesController');
  const cover = req.body?.coverCharges ? coverFromDeposit(booking, 'Charged with the deposit deduction') : null;
  if (cover) {
    if (amount < cover.total) throw new HttpError(400, `The deduction must include the open ${cover.label} (AED ${cover.total}).`);
    note = [note, `${cover.label} AED ${cover.total}`].filter(Boolean).join(' + ');
  }
  try {
    await billing.settleCardDeposit(booking, amount, note, `staff:${req.user.userId}`);
  } catch (err) {
    throw new HttpError(err.status || 500, err.message, err.code);
  }
  if (cover) await (await col('bookings')).updateOne({ _id: booking._id }, { $set: { installments: cover.installments, charges: cover.charges } });
  await completeRequest(booking, req);
  await respond(res, booking._id);
});

/** POST /admin/bookings/:id/deposit/refund { amount?, note, method?, reference? } - deposit that was charged. */
exports.refundDeposit = handle(async (req, res) => {
  const booking = await staffBooking(req);
  const _id = booking._id;
  if (!REFUNDABLE_STATUSES.includes(booking.status)) {
    throw new HttpError(409, 'Refund the deposit after the return inspection (or a cancellation).', 'NOT_REFUNDABLE_YET');
  }
  const dep = booking.deposit;
  if (!dep || dep.mode === 'card_on_file' || !['held', 'partially_refunded'].includes(dep.status)) throw new HttpError(409, 'No charged deposit is held for this booking.');
  checkHold(booking, req);
  const offline = !dep.paymentIntentId;
  const refundMethod = typeof req.body?.method === 'string' ? req.body.method.slice(0, 30) : '';
  if (offline && !refundMethod) throw new HttpError(400, 'This deposit was paid offline - say how it was returned (cash, bank transfer...)');

  const remaining = pay.round2(dep.amount - (dep.refunded || 0));
  const { coverFromDeposit } = require('./chargesController');
  const cover = req.body?.coverCharges ? coverFromDeposit(booking, 'Deducted from the security deposit') : null;
  if (cover && cover.total > remaining) {
    throw new HttpError(409, `Open ${cover.label} (AED ${cover.total}) are more than the deposit left (AED ${remaining}). Bill them instead.`, 'CHARGES_EXCEED_DEPOSIT');
  }
  const maxRefund = pay.round2(remaining - (cover?.total || 0));
  const amount = req.body?.amount === undefined ? maxRefund : pay.round2(Number(req.body.amount));
  if (!(amount >= 0 && amount <= maxRefund)) throw new HttpError(400, `Refund must be between 0 and AED ${maxRefund}`);
  let note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : '';
  if (amount < maxRefund && note.length < 5) throw new HttpError(400, 'Explain the deduction (damage, fuel, fines) for a partial refund');
  if (cover) note = [note, `${cover.label} AED ${cover.total}`].filter(Boolean).join(' + ');

  let refundId = null;
  if (amount > 0 && !offline) {
    const refund = await pay.getStripe().refunds.create(
      { payment_intent: dep.paymentIntentId, amount: pay.toFils(amount), metadata: { bookingId: _id.toString(), type: 'deposit' } },
      { idempotencyKey: `vanly-dep-${_id}-${pay.toFils(dep.refunded || 0)}-${pay.toFils(amount)}` }
    );
    refundId = refund.id;
  }
  const refunded = pay.round2((dep.refunded || 0) + amount);
  const deposit = {
    ...dep,
    refunded,
    status: refunded >= dep.amount ? 'refunded' : 'settled_with_deductions',
    deductions: pay.round2(dep.amount - refunded),
    deductionNote: note,
    ...(offline ? { refundMethod, refundReference: typeof req.body?.reference === 'string' ? req.body.reference.slice(0, 120) : '' } : {}),
    settledAt: new Date(),
    refundIds: [...(dep.refundIds || []), ...(refundId ? [refundId] : [])],
  };
  const bookings = await col('bookings');
  await bookings.updateOne({ _id }, { $set: { deposit, updatedAt: new Date(), ...(cover ? { installments: cover.installments, charges: cover.charges } : {}) } });
  await audit('deposit.settled', { userId: req.user.userId, organizationId: booking.supplierOrgId }, { bookingId: _id, refunded: amount, deductions: deposit.deductions, note, refundId });
  await completeRequest(booking, req);
  notifyLater(booking, 'deposit_settled', { refunded: amount, deductions: deposit.deductions, note, toCard: !offline, iban: booking.depositRefundRequest?.iban ? hold.maskIban(booking.depositRefundRequest.iban) : null });
  await respond(res, _id);
});

/** Staff refunds before the hold ends need an explicit early: true. */
function checkHold(booking, req) {
  const on = hold.availableOn(booking);
  if (on && !hold.isAvailable(booking) && req.body?.early !== true) {
    throw new HttpError(409, `The deposit is held until ${on} (${hold.holdDays()} days after return) for late Salik / fines. Confirm to refund early.`, 'HOLD_PERIOD', { availableOn: on });
  }
}

async function completeRequest(booking, req) {
  if (booking.depositRefundRequest?.status !== 'requested') return;
  const bookings = await col('bookings');
  await bookings.updateOne(
    { _id: booking._id },
    { $set: { depositRefundRequest: { ...booking.depositRefundRequest, status: 'completed', decidedAt: new Date(), decidedBy: req.user.userId } } }
  );
}

/** POST /bookings/:id/deposit/refund-request { iban?, accountName? } (client, after the hold) */
exports.requestDepositRefund = handle(async (req, res) => {
  const booking = await findOwnBooking(req);
  const terms = pay.termsOf(booking);
  if (!hold.depositOpen(booking, terms)) throw new HttpError(409, 'There is no deposit left to refund on this booking.', 'NOTHING_TO_REFUND');
  const on = hold.availableOn(booking);
  if (!on) throw new HttpError(409, 'The deposit can be refunded after you return the van.', 'NOT_RETURNED');
  if (!hold.isAvailable(booking)) throw new HttpError(409, `Your deposit refund opens on ${on}, ${hold.holdDays()} days after return, so any late Salik or fines can be cleared.`, 'NOT_AVAILABLE_YET', { availableOn: on });
  if (booking.depositRefundRequest?.status === 'requested') throw new HttpError(409, 'You have already requested this refund. We will process it shortly.', 'ALREADY_REQUESTED');

  // A deposit paid in cash / transfer goes back by bank transfer: we need an IBAN.
  const needsBank = terms.depositMode === 'charge' && !booking.deposit?.paymentIntentId;
  let iban = null;
  let accountName = null;
  if (needsBank) {
    iban = hold.normaliseIban(req.body?.iban);
    accountName = typeof req.body?.accountName === 'string' ? req.body.accountName.trim().slice(0, 80) : '';
    if (!hold.validUaeIban(iban)) throw new HttpError(400, 'Enter a valid UAE IBAN (AE followed by 21 digits).', 'INVALID_IBAN');
    if (accountName.length < 3) throw new HttpError(400, 'Enter the account holder name.', 'ACCOUNT_NAME_REQUIRED');
  }
  const request = hold.newRequest({ iban, accountName, by: 'customer' });
  const bookings = await col('bookings');
  await bookings.updateOne({ _id: booking._id }, { $set: { depositRefundRequest: request, updatedAt: new Date() } });
  await audit('deposit.refund_requested', { customerId: booking.customerId }, { bookingId: booking._id, bank: !!iban });
  notifyLater(booking, 'refund_requested', { cardOnFile: terms.depositMode === 'card_on_file', toCard: !needsBank && terms.depositMode === 'charge' });
  res.json({ status: 'success', data: { booking: publicBooking(await bookings.findOne({ _id: booking._id })) } });
});

/** POST /admin/bookings/:id/deposit/refund-request/decline { note } */
exports.declineRefundRequest = handle(async (req, res) => {
  const booking = await staffBooking(req);
  if (booking.depositRefundRequest?.status !== 'requested') throw new HttpError(409, 'There is no open refund request.');
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';
  if (note.length < 5) throw new HttpError(400, 'Tell the client why (shown in the app).');
  const bookings = await col('bookings');
  await bookings.updateOne({ _id: booking._id }, { $set: { depositRefundRequest: { ...booking.depositRefundRequest, status: 'declined', note, decidedAt: new Date(), decidedBy: req.user.userId } } });
  await audit('deposit.refund_declined', { userId: req.user.userId }, { bookingId: booking._id, note });
  notifyLater(booking, 'refund_declined', { note });
  await respond(res, booking._id);
});

exports.nextAction = nextAction;
