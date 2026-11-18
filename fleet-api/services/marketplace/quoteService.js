/**
 * Server-side quote with the company's settings (duration discounts, protection plans) and an optional coupon.
 */
const { buildQuote } = require('./pricing');
const settingsSvc = require('./settings');
const coupons = require('./coupons');

/**
 * @returns {Promise<{ error?: string, quote?: object, coupon?: object, couponError?: string, settings: object }>}
 *   couponError: the code could not be used (the quote is still returned, without it)
 */
async function quoteFor(listing, input = {}) {
  const settings = await settingsSvc.getSettings(listing.organizationId);
  let coupon = null;
  let couponError = null;
  if (input.couponCode) {
    const r = await coupons.findUsable(listing.organizationId, input.couponCode, { months: input.plan === 'monthly' ? Number(input.units) || 1 : 1 });
    if (r.error) couponError = r.error;
    else coupon = r.coupon;
  }
  const { error, quote } = buildQuote(listing, input, { settings, coupon });
  return { error, quote, coupon, couponError, settings };
}

module.exports = { quoteFor };
