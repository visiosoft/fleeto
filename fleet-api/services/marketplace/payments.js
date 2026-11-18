/**
 * Payment terms and instalment schedules for marketplace bookings.
 *
 * Terms (per booking, set by staff; app bookings start with APP_BOOKING_TERMS, staff bookings with DEFAULT_TERMS):
 *   rentTiming   'advance'  - each month's rent is due at the START of that month (month 1 upfront)
 *                'arrears'  - each month's rent is due at the END of that month
 *   depositMode  'charge'        - the deposit is charged upfront and refunded after return
 *                'card_on_file'  - the card is saved; nothing is charged unless there are deductions
 *   autoCharge   true  - rent is charged to the saved card automatically on each due date
 *
 * Amounts always come from the server-side quote, never from the app.
 */
const { VAT_RATE, addPlan, parseDay } = require('./pricing');
const extra = require('./charges');
const hold = require('./depositHold');

const round2 = (n) => Math.round(n * 100) / 100;
const toFils = (aed) => Math.round(aed * 100);

const DEFAULT_TERMS = Object.freeze({ rentTiming: 'advance', depositMode: 'charge', autoCharge: false });
/**
 * Bookings made in the app: only the security deposit is paid up front (and the card is saved);
 * each month's rent is charged to that card automatically at the end of the month. Staff can change it per booking.
 */
const APP_BOOKING_TERMS = Object.freeze({ rentTiming: 'arrears', depositMode: 'charge', autoCharge: true });

function normalizeTerms(input = {}, base = DEFAULT_TERMS) {
  const t = { ...base };
  if (input.rentTiming !== undefined) {
    if (!['advance', 'arrears'].includes(input.rentTiming)) throw Object.assign(new Error('rentTiming must be advance or arrears'), { status: 400 });
    t.rentTiming = input.rentTiming;
  }
  if (input.depositMode !== undefined) {
    if (!['charge', 'card_on_file'].includes(input.depositMode)) throw Object.assign(new Error('depositMode must be charge or card_on_file'), { status: 400 });
    t.depositMode = input.depositMode;
  }
  if (input.autoCharge !== undefined) t.autoCharge = input.autoCharge === true || input.autoCharge === 'true';
  return t;
}

function termsOf(booking) {
  return { ...DEFAULT_TERMS, ...(booking?.paymentTerms || {}) };
}

/** A saved card is needed when the deposit is a card guarantee or rent is auto-charged. */
function needsCard(terms) {
  return terms.depositMode === 'card_on_file' || !!terms.autoCharge;
}

let stripeOverride = null;

/** Inject a fake client in tests. */
function configureStripe(client) {
  stripeOverride = client;
}

function getStripe() {
  if (stripeOverride) return stripeOverride;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const err = new Error('Online payment is not available yet. Please contact the provider.');
    err.status = 503;
    err.code = 'PAYMENTS_NOT_CONFIGURED';
    throw err;
  }
  // eslint-disable-next-line global-require
  return require('stripe')(key, { maxNetworkRetries: 2 });
}

function webhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || '';
}

/**
 * One payment. rent = gross monthly rent; discount = coupon off that rent; protection = cover add-on.
 * VAT comes from the quote's month (so payments always add up to the quote).
 */
function inst(fields) {
  const discount = fields.discount || 0;
  const protection = fields.protection || 0;
  const total = round2(fields.rent - discount + protection + fields.delivery + fields.vat + fields.deposit);
  return { ...fields, discount, protection, baseTotal: total, total, status: 'due' };
}

/** Per-month amounts from the quote; older quotes (before protection / coupons) are rebuilt the old way. */
function quoteMonths(quote) {
  if (Array.isArray(quote.months) && quote.months.length) return quote.months;
  const monthly = quote.plan === 'monthly';
  const periods = monthly ? quote.units : 1;
  const rent = monthly ? round2(quote.rate) : round2(quote.lines.rental);
  const vatRate = quote.lines.vatRate ?? VAT_RATE;
  const out = [];
  for (let k = 1; k <= periods; k += 1) {
    const del = k === 1 ? round2(quote.lines.delivery || 0) : 0;
    out.push({ k, rent, couponDiscount: 0, protection: 0, delivery: del, vat: round2((rent + del) * vatRate) });
  }
  return out;
}

/** Instalment schedule derived from the quote and the payment terms. */
function buildSchedule(quote, termsInput) {
  const terms = { ...DEFAULT_TERMS, ...(termsInput || {}) };
  const start = parseDay(quote.startDate);
  const monthly = quote.plan === 'monthly';
  const deposit = terms.depositMode === 'charge' ? round2(quote.lines.deposit || 0) : 0;
  const ymd = (d) => d.toISOString().slice(0, 10);
  const out = [];
  const rentInst = (m, extra) => inst({
    kind: 'rent', month: monthly ? m.k : null, rent: m.rent, discount: m.couponDiscount || 0, protection: m.protection || 0,
    delivery: m.delivery || 0, vat: m.vat, ...extra,
  });

  if (terms.rentTiming === 'arrears') {
    if (deposit) {
      out.push(inst({ kind: 'deposit', month: null, upfront: true, dueDate: ymd(start), rent: 0, delivery: 0, vat: 0, deposit }));
    }
    for (const m of quoteMonths(quote)) {
      const due = monthly ? addPlan(start, 'monthly', m.k) : parseDay(quote.endDate);
      out.push(rentInst(m, { upfront: false, dueDate: ymd(due), deposit: 0 }));
    }
  } else {
    for (const m of quoteMonths(quote)) {
      const due = m.k === 1 ? start : addPlan(start, 'monthly', m.k - 1);
      out.push(rentInst(m, { upfront: m.k === 1, dueDate: ymd(due), deposit: m.k === 1 ? deposit : 0 }));
    }
  }
  return out.map((i, idx) => ({ n: idx + 1, ...i }));
}

/** Older bookings stored instalments without kind/upfront; fill them in. */
function scheduleOf(booking) {
  const stored = Array.isArray(booking.installments) && booking.installments.length ? booking.installments : null;
  const list = stored || buildSchedule(booking.quote, termsOf(booking));
  return list.map((i) => ({
    kind: i.kind || (i.rent ? 'rent' : 'deposit'),
    month: i.month !== undefined ? i.month : (booking.quote?.plan === 'monthly' ? i.n : null),
    upfront: i.upfront !== undefined ? i.upfront : i.n === 1,
    baseTotal: i.baseTotal ?? round2((i.total || 0) - (i.extrasAmount || 0)),
    ...i,
  }));
}

function instLabel(i) {
  if (i.kind === 'deposit') return 'Security deposit';
  if (i.kind === 'extras') {
    const l = i.extrasLabel || 'extra charges';
    return l.charAt(0).toUpperCase() + l.slice(1);
  }
  const base = i.month ? `Month ${i.month}` : 'Rental';
  const withDeposit = i.deposit ? `${base} + deposit` : base;
  return i.extrasLabel ? `${withDeposit} + ${i.extrasLabel}` : withDeposit;
}

/** Ready to confirm: upfront instalment (if any) paid, and a card saved when the deposit is a card guarantee. */
function readyToConfirm(booking) {
  const terms = termsOf(booking);
  const upfront = scheduleOf(booking).find((i) => i.upfront);
  const upfrontOk = !upfront || upfront.status === 'paid';
  const cardOk = terms.depositMode !== 'card_on_file' || !!booking.card?.paymentMethodId;
  return upfrontOk && cardOk;
}

function lineItems(booking, i) {
  const title = booking.listingSnapshot?.title || 'Van rental';
  const driver = booking.quote?.driver === 'with_driver' ? ' with driver' : '';
  const item = (name, amount) => ({
    quantity: 1,
    price_data: { currency: 'aed', unit_amount: toFils(amount), product_data: { name } },
  });
  const items = [];
  if (i.rent) {
    const period = i.month ? `month ${i.month}` : `${booking.quote.startDate} to ${booking.quote.endDate}`;
    const coupon = i.discount ? ` (coupon ${booking.quote?.coupon?.code || ''} -AED ${i.discount})` : '';
    items.push(item(`${title}${driver} - rent, ${period}${coupon}`, round2(i.rent - (i.discount || 0))));
  }
  if (i.protection) items.push(item(`${booking.quote?.protection?.name || 'Protection plan'} - ${i.month ? `month ${i.month}` : 'rental'}`, i.protection));
  if (i.delivery) items.push(item('Delivery', i.delivery));
  if (i.vat) items.push(item(`VAT ${Math.round((booking.quote.lines.vatRate ?? VAT_RATE) * 100)}%`, i.vat));
  if (i.deposit) items.push(item('Refundable security deposit', i.deposit));
  for (const x of extra.lineItems(i, booking.charges)) items.push(item(x.name, x.amount));
  return items;
}

/** Public, customer-safe payment summary for a booking. */
function paymentSummary(booking) {
  const schedule = scheduleOf(booking);
  const terms = termsOf(booking);
  const next = schedule.find((i) => i.status !== 'paid') || null;
  const upfront = schedule.find((i) => i.upfront) || null;
  const charges = booking.charges || [];
  const pending = charges.filter((c) => c.status === 'pending');
  const pendingTotal = extra.sum(pending);
  return {
    terms,
    charges: charges.map(extra.publicCharge),
    pendingCharges: { count: pending.length, total: pendingTotal, label: pending.length ? extra.extrasLabel(pending) : null },
    installments: schedule.map((i) => ({
      n: i.n, kind: i.kind, month: i.month, upfront: !!i.upfront, label: instLabel(i), dueDate: i.dueDate,
      rent: i.rent, discount: i.discount || 0, protection: i.protection || 0, delivery: i.delivery, vat: i.vat, deposit: i.deposit, total: i.total,
      extrasAmount: i.extrasAmount || 0, extras: i.extras || [],
      status: i.status, paidAt: i.paidAt || null, method: i.method || null,
      lastAttempt: i.chargeAttempts?.length ? i.chargeAttempts[i.chargeAttempts.length - 1] : null,
    })),
    nextDue: next
      ? { n: next.n, label: instLabel(next), dueDate: next.dueDate, total: next.total, upfront: !!next.upfront, pendingExtras: next.upfront ? 0 : pendingTotal }
      : null,
    upfront: upfront ? { n: upfront.n, label: instLabel(upfront), total: upfront.total, status: upfront.status } : null,
    paidTotal: round2(schedule.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0)),
    cardRequired: needsCard(terms),
    card: booking.card?.paymentMethodId
      ? { brand: booking.card.brand || 'card', last4: booking.card.last4 || '', expMonth: booking.card.expMonth || null, expYear: booking.card.expYear || null }
      : null,
    deposit: depositView(booking, terms, charges),
  };
}

/** Deposit status plus the 21-day refund hold and the client's refund request. */
function depositView(booking, terms, charges) {
  let d = null;
  if (booking.deposit) {
    d = { amount: booking.deposit.amount, status: booking.deposit.status, refunded: booking.deposit.refunded || 0, mode: booking.deposit.mode || 'charge', deductions: booking.deposit.deductions || 0 };
  } else if (terms.depositMode === 'card_on_file') {
    d = { amount: booking.quote?.lines?.deposit || 0, status: booking.card?.paymentMethodId ? 'card_on_file' : 'card_needed', refunded: 0, mode: 'card_on_file', deductions: 0 };
  }
  if (!d) return null;
  const openCharges = extra.sum(charges.filter((c) => c.status === 'pending' || c.status === 'billed'));
  const settleable = hold.depositOpen(booking, terms);
  const remaining = d.mode === 'card_on_file' ? d.amount : round2(d.amount - d.refunded);
  return {
    ...d,
    settleable,
    availableOn: settleable ? hold.availableOn(booking) : null,
    availableNow: settleable && hold.isAvailable(booking),
    holdDays: hold.holdDays(),
    openCharges,
    // what the client should expect back (card on file: the card is released, nothing comes back)
    estimate: settleable ? Math.max(0, round2(remaining - openCharges)) : 0,
    // where the money goes: back to the paying card, or by bank transfer (deposit paid in cash / transfer)
    refundTo: d.mode === 'card_on_file' ? null : booking.deposit?.paymentIntentId ? 'card' : 'bank',
    request: hold.publicRequest(booking.depositRefundRequest),
  };
}

module.exports = {
  DEFAULT_TERMS,
  APP_BOOKING_TERMS, normalizeTerms, termsOf, needsCard, readyToConfirm, instLabel,
  configureStripe, getStripe, webhookSecret, buildSchedule, scheduleOf, lineItems, paymentSummary, toFils, round2,
};
