/**
 * Coupon codes per company (mp_coupons).
 *   type 'percent' - value % off the monthly rent; scope 'all' (every month) or 'first' (first month only)
 *   type 'fixed'   - value AED off the first month's rent (never more than that rent)
 * Coupons never reduce protection, delivery, VAT base of other items or the deposit.
 */
const { col } = require('./store');

const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);

function todayDubai() {
  return new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
}

/** Find a usable coupon or explain why not. */
async function findUsable(organizationId, code, { months = 1 } = {}) {
  const c = normCode(code);
  if (!c) return { error: 'Enter a coupon code' };
  const coupons = await col('coupons');
  const coupon = await coupons.findOne({ organizationId: String(organizationId), code: c });
  if (!coupon || !coupon.active) return { error: 'This coupon code is not valid' };
  const today = todayDubai();
  if (coupon.validFrom && today < coupon.validFrom) return { error: `This coupon starts on ${coupon.validFrom}` };
  if (coupon.validTo && today > coupon.validTo) return { error: 'This coupon has expired' };
  if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) return { error: 'This coupon has been fully used' };
  if (coupon.minMonths && months < coupon.minMonths) return { error: `This coupon needs a booking of ${coupon.minMonths} months or more` };
  return { coupon };
}

/** Count one use; fails if the last use was taken meanwhile. */
async function consume(coupon) {
  const coupons = await col('coupons');
  const filter = { _id: coupon._id };
  if (coupon.maxUses) filter.usedCount = { $lt: coupon.maxUses };
  const r = await coupons.updateOne(filter, { $inc: { usedCount: 1 }, $set: { lastUsedAt: new Date() } });
  return r.matchedCount === 1;
}

function validate(b) {
  const errors = [];
  const code = normCode(b.code);
  if (code.length < 3) errors.push('code must be at least 3 letters/numbers');
  const type = b.type;
  if (!['percent', 'fixed'].includes(type)) errors.push('type must be percent or fixed');
  const value = Math.round(Number(b.value) * 100) / 100;
  if (type === 'percent' && !(value > 0 && value <= 100)) errors.push('percent must be 1-100');
  if (type === 'fixed' && !(value > 0 && value <= 100000)) errors.push('amount must be more than 0');
  const scope = type === 'fixed' ? 'first' : (b.scope === 'first' ? 'first' : 'all');
  const day = (v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const maxUses = b.maxUses ? Number(b.maxUses) : null;
  if (maxUses !== null && !(Number.isInteger(maxUses) && maxUses > 0)) errors.push('max uses must be a whole number');
  const minMonths = b.minMonths ? Number(b.minMonths) : null;
  if (minMonths !== null && !(Number.isInteger(minMonths) && minMonths >= 1 && minMonths <= 12)) errors.push('minimum months must be 1-12');
  return {
    errors,
    value: {
      code, type, value, scope, validFrom: day(b.validFrom), validTo: day(b.validTo), maxUses, minMonths,
      description: String(b.description || '').trim().slice(0, 120), active: b.active !== false,
    },
  };
}

function publicCoupon(c) {
  return {
    id: c._id.toString(), code: c.code, type: c.type, value: c.value, scope: c.scope, validFrom: c.validFrom, validTo: c.validTo,
    maxUses: c.maxUses, usedCount: c.usedCount || 0, minMonths: c.minMonths, description: c.description, active: c.active,
  };
}

module.exports = { normCode, findUsable, consume, validate, publicCoupon };
