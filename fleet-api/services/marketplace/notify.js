/**
 * Client notifications for marketplace bookings (WhatsApp or SMS via the existing Twilio account).
 *
 * - Never throws and never blocks the request: callers fire and forget.
 * - Every message is recorded in mp_notifications (sent / failed / logged / skipped).
 * - With no Twilio credentials (local dev) messages are logged, not sent.
 *
 * Env:
 *   MARKETPLACE_NOTIFICATIONS        'off' disables everything (default on)
 *   MARKETPLACE_NOTIFY_CHANNEL       'whatsapp' (default when TWILIO_WHATSAPP_NUMBER is set) or 'sms'
 *   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_NUMBER / TWILIO_SMS_FROM
 *   MARKETPLACE_APP_URL              link to download / open the app (added to first messages)
 */
const { col } = require('./store');
const { toId } = require('./util');

const aed = (n) => `AED ${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const day = (ymd) => {
  if (!ymd) return '';
  const d = new Date(String(ymd).length === 10 ? `${ymd}T00:00:00Z` : ymd);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dubai' });
};
const lcFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const appLine = () => (process.env.MARKETPLACE_APP_URL ? `\nOpen VANLY: ${process.env.MARKETPLACE_APP_URL}` : '');

/** Message templates. `b` is the raw booking document, `x` event extras. */
const TEMPLATES = {
  booked_for_you: (b, x) =>
    `${x.supplier} has booked a ${b.listingSnapshot?.title} for you (${b.reference}), ${day(b.quote?.startDate)} to ${day(b.quote?.endDate)}.` +
    `${x.nextStep ? ` ${x.nextStep}` : ''}\nSign in to the VANLY app with this number to see it.${appLine()}`,
  booking_received: (b) =>
    `We received your booking ${b.reference} for a ${b.listingSnapshot?.title}. Pay the first month and deposit in the VANLY app to confirm it, then upload your documents.`,
  approved: (b) =>
    `Good news - booking ${b.reference} is approved. We'll share the rental agreement and payment details next.`,
  payment_requested: (b, x) =>
    x.cardOnly
      ? `Booking ${b.reference} is ready. Please add your card in the VANLY app to confirm it - it is kept on file for the security deposit${x.auto ? ' and monthly rent' : ''}.${appLine()}`
      : `Booking ${b.reference} is ready. Please pay ${aed(x.amount)} (${lcFirst(String(x.label || 'first payment'))}) in the VANLY app to confirm it.${appLine()}`,
  payment_received: (b, x) =>
    x.confirmed
      ? `Payment of ${aed(x.amount)} (${lcFirst(String(x.label))}) received - booking ${b.reference} is confirmed. ${x.docsNeeded ? 'Next, upload your documents in the VANLY app so we can dispatch your van.' : "We'll message you when your van is dispatched."}`
      : `Payment of ${aed(x.amount)} for ${lcFirst(String(x.label))} of booking ${b.reference} received${x.auto ? ' from your saved card' : ''}. Thank you!`,
  payment_due: (b, x) =>
    x.autoLast4
      ? `Reminder: ${lcFirst(String(x.label))} of booking ${b.reference} (${aed(x.amount)}) will be charged to your card ending ${x.autoLast4} on ${day(x.dueDate)}.`
      : `Reminder: ${lcFirst(String(x.label))} of booking ${b.reference} (${aed(x.amount)}) is due ${x.today ? 'today' : `on ${day(x.dueDate)}`}. You can pay in the VANLY app.${appLine()}`,
  payment_failed: (b, x) =>
    `We couldn't charge your card ending ${x.last4} for ${lcFirst(String(x.label))} of booking ${b.reference} (${aed(x.amount)}). Please pay in the VANLY app or update your card.${appLine()}`,
  card_saved: (b, x) =>
    `Your ${x.brand} card ending ${x.last4} is saved for booking ${b.reference}.${x.auto ? ' Monthly rent will be charged to it automatically on each due date.' : ''}${x.cardDeposit ? ' It is kept on file for the security deposit; nothing is charged unless there are deductions.' : ''}`,
  deposit_deducted: (b, x) =>
    `Booking ${b.reference}: ${aed(x.deductions)} was charged to your card ending ${x.last4} from the security deposit (${x.note}). The card is no longer kept for this booking.`,
  deposit_released: (b) =>
    `Booking ${b.reference}: no deductions - your card is no longer held for the security deposit. Thank you for renting with us!`,
  dispatched: (b, x) =>
    `Your van for booking ${b.reference} is on hire: ${[x.make, x.model].filter(Boolean).join(' ')} plate ${x.plate}.` +
    `${x.driver ? ` Your driver is ${x.driver}${x.driverPhone ? ` (${x.driverPhone})` : ''}.` : ''} Return date: ${day(b.quote?.endDate)}. Drive safe!`,
  returned: (b) =>
    `Booking ${b.reference}: the van has been returned and your rental contract has ended. We'll settle your deposit after the inspection.`,
  deposit_settled: (b, x) => {
    const where = x.toCard ? ' to your card (it can take 5-10 working days to show)' : x.iban ? ` to ${x.iban}` : '';
    return x.deductions > 0
      ? `Deposit for booking ${b.reference}: ${aed(x.refunded)} refunded${where}, ${aed(x.deductions)} deducted (${x.note}).`
      : `Your deposit of ${aed(x.refunded)} for booking ${b.reference} has been refunded${where}. Thank you for renting with us!`;
  },
  deposit_available: (b, x) =>
    x.cardOnFile
      ? `Booking ${b.reference}: the ${x.days}-day deposit hold has ended. Request the release of your card in the VANLY app.${appLine()}`
      : `Booking ${b.reference}: your deposit refund${x.estimate ? ` of about ${aed(x.estimate)}` : ''} is now available. Request it in the VANLY app.${appLine()}`,
  refund_requested: (b, x) =>
    x.cardOnFile
      ? `We received your request to release the deposit on booking ${b.reference}. We'll confirm shortly.`
      : `We received your deposit refund request for booking ${b.reference}. We'll process it shortly${x.toCard ? ' - it goes back to the card you paid with' : ' by bank transfer'}.`,
  refund_declined: (b, x) =>
    `Your deposit refund request for booking ${b.reference} needs attention: ${x.note}. Please contact us or request again in the app.`,
  document_rejected: (b, x) =>
    `Your ${x.label} needs to be uploaded again: ${x.note}. Please update it in the VANLY app so we can approve your booking.${appLine()}`,
  rejected: (b, x) => `Sorry, booking ${b.reference} could not be approved${x.note ? `: ${x.note}` : '.'}`,
  cancelled: (b, x) => `Booking ${b.reference} has been cancelled${x.note ? `: ${x.note}` : '.'}`,
};

function channel() {
  const pref = (process.env.MARKETPLACE_NOTIFY_CHANNEL || '').toLowerCase();
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, TWILIO_SMS_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  const wa = TWILIO_WHATSAPP_NUMBER && (TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? TWILIO_WHATSAPP_NUMBER : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
  if (pref === 'sms' && TWILIO_SMS_FROM) return { type: 'sms', from: TWILIO_SMS_FROM };
  if (wa) return { type: 'whatsapp', from: wa };
  if (TWILIO_SMS_FROM) return { type: 'sms', from: TWILIO_SMS_FROM };
  return null;
}

let sender = null; // tests can inject
function configureSender(fn) {
  sender = fn;
}

async function deliver(ch, to, body) {
  if (sender) return sender({ channel: ch.type, to, body });
  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const msg = await twilio.messages.create({ from: ch.from, to: ch.type === 'whatsapp' ? `whatsapp:${to}` : to, body });
  return { id: msg.sid };
}

/**
 * Send one notification about a booking. Resolves when recorded; never rejects.
 * @param {object} booking raw booking document (needs customerId, reference, listingSnapshot, quote)
 * @param {string} event   key of TEMPLATES
 * @param {object} extras  template values
 */
async function notifyBooking(booking, event, extras = {}) {
  try {
    if ((process.env.MARKETPLACE_NOTIFICATIONS || '').toLowerCase() === 'off') return { status: 'disabled' };
    const template = TEMPLATES[event];
    if (!template || !booking) return { status: 'skipped' };
    const customers = await col('customers');
    const customer = await customers.findOne({ _id: toId(booking.customerId) });
    const notifications = await col('notifications');
    const record = {
      customerId: booking.customerId,
      bookingId: booking._id?.toString() || null,
      supplierOrgId: booking.supplierOrgId || null,
      event,
      to: customer?.phone || null,
      createdAt: new Date(),
    };
    if (!customer?.phone || customer.isGuest || customer.notifications === false) {
      await notifications.insertOne({ ...record, status: 'skipped', reason: 'no phone or opted out' });
      return { status: 'skipped' };
    }
    const supplier = booking.listingSnapshot?.supplierName || 'Your rental provider';
    const body = template(booking, { supplier, ...extras });
    const ch = sender ? { type: 'test' } : channel();
    if (!ch) {
      console.log(`[marketplace] notification (not sent, Twilio not configured) to ${customer.phone}: ${body}`);
      await notifications.insertOne({ ...record, body, channel: null, status: 'logged' });
      return { status: 'logged', body };
    }
    try {
      const res = await deliver(ch, customer.phone, body);
      await notifications.insertOne({ ...record, body, channel: ch.type, status: 'sent', providerId: res?.id || null });
      return { status: 'sent', body };
    } catch (err) {
      console.error(`[marketplace] notification ${event} failed:`, err.message);
      await notifications.insertOne({ ...record, body, channel: ch.type, status: 'failed', error: err.message.slice(0, 300) });
      return { status: 'failed', body };
    }
  } catch (err) {
    console.error('[marketplace] notifyBooking error', err);
    return { status: 'error' };
  }
}

/** Fire and forget: never delays or breaks the caller. */
function notifyLater(booking, event, extras) {
  setImmediate(() => { notifyBooking(booking, event, extras); });
}

module.exports = { TEMPLATES, notifyBooking, notifyLater, configureSender };
