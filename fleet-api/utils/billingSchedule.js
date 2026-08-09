// Turns a contract into the list of invoice periods it should produce.
//
// Two independent dials drive this:
//   rateUnit     - what the amount is quoted in (per day / week / month)
//   billingCycle - how often an invoice goes out (daily .. yearly, or upfront)
//
// They are deliberately not the same thing. A car quoted at AED 150/day on a
// 45-day hire billed monthly produces two invoices: one for 31 days and one for
// 14, both priced off the daily rate. Every amount here is derived from the
// rate, never from a stored per-period figure, so changing the rate re-prices
// the whole schedule consistently.

const DAY_MS = 24 * 60 * 60 * 1000;

// Cycle length, expressed in whichever unit steps cleanly
const CYCLE_DAYS = { daily: 1, weekly: 7 };
const CYCLE_MONTHS = { monthly: 1, quarterly: 3, yearly: 12 };

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
};

// Calendar-aware month step. Jan 31 + 1 month lands on Feb 28/29 rather than
// rolling into March, so a contract started on the 31st keeps billing at
// month end instead of drifting forward.
const addMonths = (date, n) => {
    const d = new Date(date);
    const targetDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const lastDayOfTarget = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(targetDay, lastDayOfTarget));
    return d;
};

const daysBetween = (start, end) =>
    Math.round((startOfDay(end) - startOfDay(start)) / DAY_MS);

/**
 * Length of [start, end) measured in rate units, as a fraction.
 *
 * Days and weeks are linear. Months are counted as whole calendar months plus
 * a fractional tail, where the tail is measured against the length of the month
 * it falls in - so 15 days of a 30-day month is 0.5, and 15 days of a 31-day
 * month is slightly less. This is what stops a 12-month contract from summing
 * to 12.17 months the way a flat /30 divisor does.
 */
const unitsBetween = (start, end, unit) => {
    const days = Math.max(0, daysBetween(start, end));
    if (unit === 'day') return days;
    if (unit === 'week') return days / 7;

    let whole = 0;
    let cursor = new Date(start);
    while (addMonths(cursor, 1) <= end) {
        cursor = addMonths(cursor, 1);
        whole += 1;
    }

    const tailDays = daysBetween(cursor, end);
    if (tailDays <= 0) return whole;

    const monthLength = daysBetween(cursor, addMonths(cursor, 1));
    return whole + tailDays / monthLength;
};

const round2 = (n) => Math.round(n * 100) / 100;

const normaliseRateUnit = (unit) =>
    (['day', 'week', 'month'].includes(unit) ? unit : 'month');

const isKnownCycle = (cycle) =>
    Boolean(CYCLE_DAYS[cycle]) || Boolean(CYCLE_MONTHS[cycle]) || cycle === 'upfront';

const normaliseCycle = (cycle) => (isKnownCycle(cycle) ? cycle : 'monthly');

// Boundary of the nth cycle, always measured from the anchor rather than from
// the previous boundary. Stepping month by month would let a contract starting
// on the 31st drift permanently to the 28th after passing through February.
const cycleBoundary = (anchor, cycle, n) => {
    if (CYCLE_DAYS[cycle]) return addDays(anchor, CYCLE_DAYS[cycle] * n);
    if (CYCLE_MONTHS[cycle]) return addMonths(anchor, CYCLE_MONTHS[cycle] * n);
    return null; // upfront - no second period
};

// Whole calendar months between two dates, or null if it is not a clean number
const wholeMonthsBetween = (start, end) => {
    let months = 0;
    while (months < 600) {
        const stepped = addMonths(start, months + 1);
        if (stepped > end) return null;
        months += 1;
        if (daysBetween(stepped, end) === 0) return months;
    }
    return null;
};

/**
 * Every invoice period for a contract, in order.
 *
 * Periods are half-open [periodStart, periodEnd) and anchored to startDate, not
 * to the calendar month - a hire starting on the 12th bills on the 12th. The
 * final period is clamped to endDate and is the only one that can be partial.
 *
 * Returns [] when the contract has no usable dates or no amount.
 *
 * @param {object} contract - startDate, endDate, amount, rateUnit, billingCycle, prorate
 * @returns {Array<{periodStart: Date, periodEnd: Date, units: number, amount: number, partial: boolean}>}
 */
const billingPeriods = (contract) => {
    if (!contract) return [];

    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return [];

    const rate = Number(contract.amount);
    if (!isFinite(rate) || rate <= 0) return [];

    const unit = normaliseRateUnit(contract.rateUnit);
    const cycle = normaliseCycle(contract.billingCycle);
    const prorate = contract.prorate !== false;

    const periods = [];
    let cursor = start;

    // Bounded so a malformed cycle can never spin forever
    const MAX_PERIODS = 600;

    while (cursor < end && periods.length < MAX_PERIODS) {
        const stepped = cycleBoundary(start, cycle, periods.length + 1);
        // upfront, or a cycle longer than what's left: one period to the end
        const periodEnd = !stepped || stepped > end ? end : stepped;
        const partial = periodEnd < (stepped || end);

        // A complete month-billed period on a monthly rate is one month by
        // definition, whatever its day count. Measuring it would charge a
        // month-end contract 1.1 months for Feb 28 -> Mar 31.
        const wholeCycle = !partial && unit === 'month' && CYCLE_MONTHS[cycle];

        let units = wholeCycle
            ? CYCLE_MONTHS[cycle]
            : unitsBetween(cursor, periodEnd, unit);
        // Without proration a part-period is charged as a whole one
        if (!prorate) units = Math.ceil(units);

        periods.push({
            periodStart: cursor,
            periodEnd,
            units: round2(units),
            amount: round2(rate * units),
            partial
        });

        if (!stepped) break;
        cursor = periodEnd;
    }

    return periods;
};

/**
 * The first period ending on or after `from` that has not been invoiced yet.
 * The billing job uses this to decide what to raise; returns null once the
 * contract is fully invoiced.
 */
const nextBillingPeriod = (contract, from = new Date()) => {
    const invoicedThrough = contract?.invoicedThrough
        ? new Date(contract.invoicedThrough)
        : null;

    return billingPeriods(contract).find((p) =>
        (!invoicedThrough || p.periodEnd > invoicedThrough) && p.periodEnd > from
    ) || null;
};

/**
 * Total contract value across all periods. Use this rather than
 * `amount x term` - it accounts for proration and calendar month lengths.
 */
const contractValue = (contract) =>
    round2(billingPeriods(contract).reduce((sum, p) => sum + p.amount, 0));

/**
 * End date of the term this contract renews into, or null if it does not
 * auto-renew. Defaults to a term the same length as the original.
 */
const renewalEndDate = (contract) => {
    if (!contract?.autoRenew) return null;

    const end = new Date(contract.endDate);
    if (isNaN(end.getTime())) return null;

    const { count, unit } = contract.renewalTerm || {};
    if (count && unit) {
        if (unit === 'day') return addDays(end, count);
        if (unit === 'week') return addDays(end, count * 7);
        return addMonths(end, count);
    }

    // Mirror the original term. Prefer calendar months so a 6-month contract
    // renews to the same day of the month rather than 181 days later.
    const start = new Date(contract.startDate);
    if (isNaN(start.getTime())) return null;

    const months = wholeMonthsBetween(start, end);
    return months ? addMonths(end, months) : addDays(end, daysBetween(start, end));
};

module.exports = {
    billingPeriods,
    nextBillingPeriod,
    contractValue,
    renewalEndDate,
    unitsBetween,
    addMonths,
    addDays,
    daysBetween
};
