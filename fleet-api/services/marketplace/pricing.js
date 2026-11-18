/**
 * Server-side quote calculation. The app only ever displays these numbers;
 * it never computes a payable total itself.
 */
const VAT_RATE = 0.05; // UAE standard VAT rate
const PLANS = ['daily', 'weekly', 'monthly'];
const MAX_UNITS = { daily: 30, weekly: 12, monthly: 12 };

const round2 = (n) => Math.round(n * 100) / 100;

function addPlan(start, plan, units) {
  const end = new Date(start.getTime());
  if (plan === 'daily') end.setUTCDate(end.getUTCDate() + units);
  if (plan === 'weekly') end.setUTCDate(end.getUTCDate() + units * 7);
  if (plan === 'monthly') end.setUTCMonth(end.getUTCMonth() + units);
  return end;
}

/** Parse YYYY-MM-DD as a UTC date (start of day). */
function parseDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Today's date in Dubai (UTC+4), as a UTC-midnight Date. */
function todayDubai() {
  const now = new Date(Date.now() + 4 * 60 * 60 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * @returns {{ error?: string, quote?: object }}
 */
function buildQuote(listing, { plan, units = 1, startDate, fulfilment = 'pickup', driver = 'self', protectionPlanId = null }, ctx = {}) {
  if (!PLANS.includes(plan)) return { error: 'plan must be daily, weekly or monthly' };
  if (!['self', 'with_driver'].includes(driver)) return { error: 'driver must be self or with_driver' };
  const withDriver = driver === 'with_driver';
  if (withDriver && !listing.driverOption?.available) return { error: 'This van is not offered with a driver' };
  // With a driver, the van and driver come to the customer's address; no separate delivery fee.
  if (withDriver) fulfilment = 'delivery';
  const qty = Number(units);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_UNITS[plan]) {
    return { error: `units must be between 1 and ${MAX_UNITS[plan]} for a ${plan} plan` };
  }
  const start = parseDay(startDate);
  if (!start) return { error: 'startDate must be YYYY-MM-DD' };
  if (start < todayDubai()) return { error: 'startDate cannot be in the past' };
  if (!['pickup', 'delivery'].includes(fulfilment)) return { error: 'fulfilment must be pickup or delivery' };
  if (fulfilment === 'delivery' && !withDriver && !listing.deliveryAvailable) return { error: 'Delivery is not offered for this van' };

  const listRate = Number((withDriver ? listing.driverOption?.rates : listing.rates)?.[plan]);
  if (!listRate || listRate <= 0) return { error: `This van has no ${plan} rate${withDriver ? ' with a driver' : ''}` };

  const monthly = plan === 'monthly';
  const settings = ctx.settings || null;

  // Longer bookings: % off the monthly rent (from the company's duration packages).
  let discountPct = 0;
  if (monthly && settings?.durations) {
    for (const d of settings.durations) if (qty >= d.months) discountPct = Math.max(discountPct, Number(d.discountPct) || 0);
  }
  const rate = round2(listRate * (1 - discountPct / 100));

  // Optional protection plan on top of the included third-party cover (monthly bookings).
  let protection = null;
  if (protectionPlanId) {
    if (!monthly) return { error: 'Protection plans are available on monthly bookings' };
    const p = (settings?.protectionPlans || []).find((x) => x.id === protectionPlanId && x.active);
    if (!p) return { error: 'This protection plan is not available' };
    protection = { id: p.id, name: p.name, tagline: p.tagline || '', monthlyPrice: round2(p.monthlyPrice), excess: p.excess, excessLabel: p.excessLabel || '' };
  }

  const delivery = fulfilment === 'delivery' && !withDriver ? round2(Number(listing.deliveryFee || 0)) : 0;
  const deposit = round2(Number(listing.deposit || 0));
  const kmPerUnit = Number(listing.mileageAllowance?.[plan] || 0);

  // Per-month breakdown (one entry for non-monthly plans). Every payment is built from this.
  const periods = monthly ? qty : 1;
  const coupon = ctx.coupon || null;
  const months = [];
  for (let k = 1; k <= periods; k += 1) {
    const rent = monthly ? rate : round2(rate * qty);
    let couponDiscount = 0;
    if (coupon) {
      if (coupon.type === 'percent' && (coupon.scope === 'all' || k === 1)) couponDiscount = round2(rent * coupon.value / 100);
      if (coupon.type === 'fixed' && k === 1) couponDiscount = round2(Math.min(coupon.value, rent));
    }
    const prot = protection ? protection.monthlyPrice : 0;
    const del = k === 1 ? delivery : 0;
    const vat = round2((rent - couponDiscount + prot + del) * VAT_RATE);
    months.push({ k, rent, couponDiscount, protection: prot, delivery: del, vat });
  }
  const sum = (key) => round2(months.reduce((t, m) => t + m[key], 0));
  const rental = sum('rent');
  const couponDiscount = sum('couponDiscount');
  const protectionTotal = sum('protection');
  const vat = sum('vat');
  const payableNow = round2(rental - couponDiscount + protectionTotal + delivery + vat);

  return {
    quote: {
      currency: 'AED',
      plan,
      units: qty,
      rate,
      listRate,
      discountPct,
      startDate: start.toISOString().slice(0, 10),
      endDate: addPlan(start, plan, qty).toISOString().slice(0, 10),
      fulfilment,
      driver,
      protection,
      coverage: protection ? `${protection.name} (comprehensive)` : (settings?.includedCover?.name || 'Third-party insurance'),
      coupon: coupon ? { code: coupon.code, type: coupon.type, value: coupon.value, scope: coupon.scope, discount: couponDiscount } : null,
      months,
      lines: {
        rental,
        durationDiscount: round2((listRate - rate) * (monthly ? qty : 0)),
        couponDiscount,
        protection: protectionTotal,
        delivery,
        vat,
        vatRate: VAT_RATE,
        deposit,
      },
      payableNow,
      totalWithDeposit: round2(payableNow + deposit),
      includedKm: kmPerUnit ? kmPerUnit * qty : null,
      excessKmRate: listing.excessKmRate ?? null,
      calculatedAt: new Date().toISOString(),
    },
  };
}

module.exports = { VAT_RATE, PLANS, MAX_UNITS, buildQuote, parseDay, addPlan };
