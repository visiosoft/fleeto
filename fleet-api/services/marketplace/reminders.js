/**
 * Daily billing run for marketplace bookings:
 *  - auto-charge bookings: the saved card is charged on/after each due date (one try per day, max 3 tries);
 *    the client gets a heads-up 3 days before.
 *  - everyone else: a reminder 3 days before and on the due date.
 * The upfront payment (month 1 / deposit) is not handled here - it is part of confirming the booking.
 *
 * Enable with MARKETPLACE_REMINDERS_ENABLED=true. Runs daily at 10:00 Dubai time
 * (override with MARKETPLACE_REMINDER_CRON, a UTC cron).
 */
const schedule = require('node-schedule');
const { col } = require('./store');
const pay = require('./payments');
const { notifyBooking } = require('./notify');
const billing = require('./billing');
const hold = require('./depositHold');

const AFTER_RETURN = ['inspection_pending', 'closed', 'disputed', 'cancelled', 'rejected'];

const LIVE = ['confirmed', 'handover_pending', 'active', 'overdue', 'return_pending', 'inspection_pending'];
const DAYS_BEFORE = 3;
const MAX_AUTO_ATTEMPTS = 3;

function todayDubai(now = Date.now()) {
  return new Date(now + 4 * 3600e3).toISOString().slice(0, 10);
}

function daysBetween(fromYmd, toYmd) {
  return Math.round((new Date(`${toYmd}T00:00:00Z`) - new Date(`${fromYmd}T00:00:00Z`)) / 864e5);
}

function dubaiDayOf(date) {
  return todayDubai(new Date(date).getTime());
}

/**
 * @param {{ dryRun?: boolean, now?: number }} opts
 * @returns {Promise<Array<{ reference: string, installment: number, kind: string, status: string }>>}
 */
async function runPaymentReminders({ dryRun = false, now = Date.now() } = {}) {
  const today = todayDubai(now);
  const bookings = await col('bookings');
  const rows = await bookings.find({ status: { $in: LIVE } }).toArray();
  const results = [];

  for (const bIn of rows) {
    let b = bIn;
    let inst = pay.scheduleOf(b).find((i) => i.status !== 'paid');
    const hasPending = (b.charges || []).some((c) => c.status === 'pending');
    // Rent all collected but Salik / fines pending on an auto-charge booking: bill them today.
    if (!inst && hasPending && pay.termsOf(b).autoCharge && b.card?.paymentMethodId) {
      if (dryRun) {
        results.push({ reference: b.reference, installment: null, kind: 'charge', status: 'would_bill_extras' });
        continue;
      }
      b = (await billing.billLeftoverCharges(b._id, today)) || b;
      inst = pay.scheduleOf(b).find((i) => i.status !== 'paid');
    }
    if (!inst || inst.upfront) continue;
    // After return only Salik / fines are collected automatically - never rent for months not used.
    if (b.status === 'inspection_pending' && inst.kind !== 'extras') continue;
    const pendingExtras = (b.charges || []).filter((c) => c.status === 'pending').reduce((s, c) => s + c.total, 0);
    const terms = pay.termsOf(b);
    const days = daysBetween(today, inst.dueDate);
    const auto = terms.autoCharge && b.card?.paymentMethodId;
    const label = pay.instLabel(inst);

    if (auto && days <= 0) {
      const attempts = inst.chargeAttempts || [];
      const autoAttempts = attempts.filter((a) => a.auto);
      if (autoAttempts.length >= MAX_AUTO_ATTEMPTS) {
        results.push({ reference: b.reference, installment: inst.n, kind: 'charge', status: 'gave_up' });
        continue;
      }
      if (attempts.some((a) => (a.runDay || dubaiDayOf(a.at)) === today)) continue; // already tried today
      if (dryRun) {
        results.push({ reference: b.reference, installment: inst.n, kind: 'charge', status: 'would_charge' });
        continue;
      }
      const r = await billing.chargeSavedCard(b, inst.n, { by: 'auto', auto: true, runDay: today });
      results.push({ reference: b.reference, installment: inst.n, kind: 'charge', status: r.ok ? r.status : 'failed', message: r.message });
      continue;
    }

    let kind = null;
    if (days === DAYS_BEFORE) kind = 'before';
    else if (days === 0 && !auto) kind = 'due';
    if (!kind) continue;
    const key = `${inst.n}:${kind}`;
    if ((b.remindersSent || []).includes(key)) continue;
    if (dryRun) {
      results.push({ reference: b.reference, installment: inst.n, kind, status: 'would_send' });
      continue;
    }
    const r = await notifyBooking(b, 'payment_due', {
      n: inst.n, label: pendingExtras ? `${label} + Salik / fines` : label, amount: Math.round((inst.total + pendingExtras) * 100) / 100,
      dueDate: inst.dueDate, today: kind === 'due', autoLast4: auto ? b.card.last4 : null,
    });
    await bookings.updateOne({ _id: b._id }, { $push: { remindersSent: key } });
    results.push({ reference: b.reference, installment: inst.n, kind, status: r.status });
  }
  // Deposit hold over: tell the client once that they can request the refund / card release.
  const returned = await bookings.find({ status: { $in: AFTER_RETURN } }).toArray();
  for (const b of returned) {
    const terms = pay.termsOf(b);
    if (!hold.depositOpen(b, terms) || !hold.isAvailable(b, today)) continue;
    if ((b.remindersSent || []).includes('deposit_available') || b.depositRefundRequest?.status === 'requested') continue;
    if (dryRun) {
      results.push({ reference: b.reference, installment: null, kind: 'deposit_available', status: 'would_send' });
      continue;
    }
    const summary = pay.paymentSummary(b);
    const r = await notifyBooking(b, 'deposit_available', { cardOnFile: terms.depositMode === 'card_on_file', estimate: summary.deposit?.estimate, days: hold.holdDays() });
    await bookings.updateOne({ _id: b._id }, { $push: { remindersSent: 'deposit_available' } });
    results.push({ reference: b.reference, installment: null, kind: 'deposit_available', status: r.status });
  }
  return results;
}

let job = null;
function startScheduler() {
  if (process.env.MARKETPLACE_REMINDERS_ENABLED !== 'true') {
    console.log('[marketplace] billing run disabled (set MARKETPLACE_REMINDERS_ENABLED=true)');
    return null;
  }
  const cron = process.env.MARKETPLACE_REMINDER_CRON || '0 6 * * *'; // 06:00 UTC = 10:00 Dubai
  job = schedule.scheduleJob(cron, async () => {
    try {
      const r = await runPaymentReminders();
      console.log(`[marketplace] billing run: ${r.length} actions`);
    } catch (err) {
      console.error('[marketplace] billing run failed', err);
    }
  });
  console.log(`[marketplace] billing run scheduled (${cron} UTC)`);
  return job;
}

module.exports = { runPaymentReminders, startScheduler, todayDubai };
