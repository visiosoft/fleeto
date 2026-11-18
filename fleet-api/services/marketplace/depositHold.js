/**
 * Security deposit hold after return.
 *
 * The deposit is kept for MARKETPLACE_DEPOSIT_HOLD_DAYS (default 21) days after the vehicle is returned,
 * so late Salik / fines can still be cleared from it. After that the client can request the refund in the
 * app; staff approve it (refund to card via Stripe, or bank transfer to the IBAN the client gave).
 */
const crypto = require('crypto');

function holdDays() {
  const n = Number(process.env.MARKETPLACE_DEPOSIT_HOLD_DAYS);
  return Number.isFinite(n) && n >= 0 ? n : 21;
}

const dubaiDay = (d) => new Date(new Date(d).getTime() + 4 * 3600e3).toISOString().slice(0, 10);
const todayDubai = () => dubaiDay(Date.now());
function addDays(ymd, n) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Set on return: when the deposit becomes refundable. */
function holdOnReturn(returnedAt = new Date()) {
  return { returnedAt, days: holdDays(), availableOn: addDays(dubaiDay(returnedAt), holdDays()) };
}

/** YYYY-MM-DD when the deposit can be refunded, or null while the van is still out. */
function availableOn(booking) {
  if (booking.depositHold?.availableOn) return booking.depositHold.availableOn;
  if (booking.contractEndedAt) return addDays(dubaiDay(booking.contractEndedAt), holdDays());
  // Cancelled / rejected before the van went out: nothing to wait for.
  if (['cancelled', 'rejected', 'expired'].includes(booking.status) && !booking.handover) return dubaiDay(booking.updatedAt || Date.now());
  return null;
}

function isAvailable(booking, today = todayDubai()) {
  const on = availableOn(booking);
  return !!on && today >= on;
}

/** Deposit still to settle? (charged and not yet refunded, or card on file not yet released) */
function depositOpen(booking, terms) {
  if (terms.depositMode === 'card_on_file') {
    return !!booking.card?.paymentMethodId && !(booking.deposit && ['settled_with_deductions', 'released'].includes(booking.deposit.status));
  }
  return !!booking.deposit && ['held', 'partially_refunded'].includes(booking.deposit.status);
}

// ---------- IBAN (UAE) ----------
function normaliseIban(v) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** UAE IBANs: AE + 2 check digits + 3-digit bank code + 16-digit account = 23 chars, mod-97 = 1. */
function validUaeIban(v) {
  const iban = normaliseIban(v);
  if (!/^AE\d{21}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1;
}

const maskIban = (iban) => (iban ? `${iban.slice(0, 4)} •••• ${iban.slice(-4)}` : '');

function newRequest({ iban, accountName, by }) {
  return {
    id: crypto.randomBytes(6).toString('hex'),
    status: 'requested',
    requestedAt: new Date(),
    requestedBy: by,
    ...(iban ? { iban: normaliseIban(iban), accountName } : {}),
  };
}

/** Client-safe view of the refund request. */
function publicRequest(r, { staff = false } = {}) {
  if (!r) return null;
  return {
    status: r.status,
    requestedAt: r.requestedAt,
    decidedAt: r.decidedAt || null,
    note: r.note || '',
    iban: r.iban ? (staff ? r.iban : maskIban(r.iban)) : null,
    accountName: r.accountName || null,
  };
}

module.exports = { holdDays, holdOnReturn, availableOn, isAvailable, depositOpen, validUaeIban, normaliseIban, maskIban, newRequest, publicRequest, todayDubai, addDays };
