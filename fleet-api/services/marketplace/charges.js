/**
 * Extra charges on a booking: Salik tolls, traffic fines and other recharges.
 *
 * Stored on the booking (`booking.charges`). Lifecycle:
 *   pending  - added, not yet on a payment
 *   billed   - attached to an unpaid instalment (it will be collected with that payment)
 *   paid     - collected with that instalment
 *   deposit  - covered from the security deposit
 *   waived   - written off by staff (with a reason)
 *
 * Before ANY collection (client checkout, auto-charge, staff charge, staff-recorded payment) pending charges
 * are attached to the instalment being collected, so the client is charged rent + Salik + fines together.
 * The toll / fine itself is a pass-through without VAT; an optional admin fee carries 5% VAT.
 */
const crypto = require('crypto');
const { VAT_RATE } = require('./pricing');

const round2 = (n) => Math.round(n * 100) / 100;
const TYPES = { salik: 'Salik', fine: 'Traffic fine', other: 'Other charge' };
const OPEN = ['pending', 'billed'];

function makeCharge({ type, description, reference, occurredAt, amount, adminFee = 0, source = 'manual', sourceId = null, by }) {
  const fee = round2(Number(adminFee) || 0);
  const vat = round2(fee * VAT_RATE);
  const amt = round2(Number(amount));
  return {
    id: crypto.randomBytes(6).toString('hex'),
    type,
    description: description || TYPES[type],
    reference: reference || '',
    occurredAt: occurredAt || null,
    amount: amt,
    adminFee: fee,
    vat,
    total: round2(amt + fee + vat),
    status: 'pending',
    installment: null,
    source,
    sourceId,
    createdBy: by,
    createdAt: new Date(),
  };
}

/** "Salik", "fines", "Salik & fines", "extra charges" for a set of charges. */
function extrasLabel(list) {
  const types = new Set(list.map((c) => c.type));
  if (types.size === 1 && types.has('salik')) return 'Salik';
  if (types.size === 1 && types.has('fine')) return list.length > 1 ? 'fines' : 'fine';
  if (types.size === 2 && types.has('salik') && types.has('fine')) return 'Salik & fines';
  return 'extra charges';
}

function sum(list) {
  return round2(list.reduce((s, c) => s + c.total, 0));
}

function withTotals(inst, charges) {
  const ids = inst.extras || [];
  const items = charges.filter((c) => ids.includes(c.id));
  const extrasAmount = sum(items);
  const baseTotal = inst.baseTotal ?? round2((inst.total || 0) - (inst.extrasAmount || 0));
  return { ...inst, baseTotal, extrasAmount, extrasLabel: items.length ? extrasLabel(items) : null, total: round2(baseTotal + extrasAmount) };
}

/**
 * Attach every pending charge to instalment n (unless it is paid or upfront).
 * @returns {null | { installments, charges, added }} the new arrays to $set, or null when nothing changed
 */
function attachPending(schedule, chargesIn, n) {
  const charges = (chargesIn || []).map((c) => ({ ...c }));
  const pending = charges.filter((c) => c.status === 'pending');
  if (!pending.length) return null;
  const idx = schedule.findIndex((i) => i.n === n);
  if (idx === -1) return null;
  const inst = schedule[idx];
  if (inst.status === 'paid' || inst.upfront) return null;
  pending.forEach((c) => { c.status = 'billed'; c.installment = n; });
  const updated = withTotals({ ...inst, extras: [...(inst.extras || []), ...pending.map((c) => c.id)] }, charges);
  const installments = schedule.map((i, k) => (k === idx ? updated : i));
  return { installments, charges, added: pending.length };
}

/** Detach charges (ids) from unpaid instalments; drops "extras" instalments left empty. */
function release(schedule, chargesIn, ids) {
  const charges = (chargesIn || []).map((c) => ({ ...c }));
  let installments = schedule.map((i) => {
    if (i.status === 'paid' || !(i.extras || []).some((id) => ids.includes(id))) return i;
    return withTotals({ ...i, extras: i.extras.filter((id) => !ids.includes(id)) }, charges);
  });
  installments = installments.filter((i) => !(i.kind === 'extras' && i.status !== 'paid' && !(i.extras || []).length));
  charges.forEach((c) => { if (ids.includes(c.id) && c.status === 'billed') { c.status = 'pending'; c.installment = null; } });
  return { installments, charges };
}

/** Add a stand-alone "Salik & fines" instalment for pending charges, due today. */
function billLeftovers(schedule, chargesIn, today) {
  const pending = (chargesIn || []).filter((c) => c.status === 'pending');
  if (!pending.length) return null;
  const n = Math.max(0, ...schedule.map((i) => i.n)) + 1;
  const shell = { n, kind: 'extras', month: null, upfront: false, dueDate: today, rent: 0, delivery: 0, vat: 0, deposit: 0, baseTotal: 0, total: 0, extras: [], status: 'due' };
  return attachPending([...schedule, shell], chargesIn, n);
}

/** Mark the charges attached to instalment n as paid. */
function markPaid(chargesIn, n, paymentId) {
  return (chargesIn || []).map((c) => (c.installment === n && c.status === 'billed' ? { ...c, status: 'paid', paymentId, paidAt: new Date() } : c));
}

function open(chargesIn) {
  return (chargesIn || []).filter((c) => OPEN.includes(c.status));
}

/** Stripe line items for the charges attached to an instalment. */
function lineItems(inst, chargesIn) {
  const items = (chargesIn || []).filter((c) => (inst.extras || []).includes(c.id));
  const out = [];
  const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  for (const c of items) {
    out.push({ name: `${TYPES[c.type]}: ${c.description}${c.occurredAt ? ` (${day(c.occurredAt)})` : ''}`.slice(0, 200), amount: c.amount });
  }
  const fees = round2(items.reduce((s, c) => s + c.adminFee, 0));
  const feeVat = round2(items.reduce((s, c) => s + c.vat, 0));
  if (fees) out.push({ name: 'Admin fees (Salik / fines)', amount: fees });
  if (feeVat) out.push({ name: 'VAT 5% on admin fees', amount: feeVat });
  return out;
}

function publicCharge(c) {
  return {
    id: c.id, type: c.type, typeLabel: TYPES[c.type], description: c.description, reference: c.reference,
    occurredAt: c.occurredAt, amount: c.amount, adminFee: c.adminFee, vat: c.vat, total: c.total,
    status: c.status, installment: c.installment, source: c.source, note: c.waivedNote || c.depositNote || '',
  };
}

module.exports = { TYPES, makeCharge, extrasLabel, attachPending, release, billLeftovers, markPaid, open, lineItems, publicCharge, withTotals, sum };
