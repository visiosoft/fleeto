/**
 * One-time passcodes for phone login.
 * Codes are stored only as hashes, expire after 5 minutes and lock after
 * 5 wrong attempts. Delivery goes through Twilio (SMS if TWILIO_SMS_FROM is
 * set, otherwise WhatsApp via TWILIO_WHATSAPP_NUMBER).
 * With no delivery channel configured outside production, the code is logged
 * and returned to the caller as `devCode` so the app can be developed locally.
 */
const crypto = require('crypto');

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_AFTER_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 5;

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function hashCode(phone, code) {
  const pepper = process.env.MARKETPLACE_OTP_PEPPER || 'vanly-otp';
  return crypto.createHash('sha256').update(`${phone}:${code}:${pepper}`).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function deliveryChannel() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM, TWILIO_WHATSAPP_NUMBER } = process.env;
  if (process.env.MARKETPLACE_OTP_DEV_MODE === 'true') return null;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  if (TWILIO_SMS_FROM) return { type: 'sms', from: TWILIO_SMS_FROM };
  if (TWILIO_WHATSAPP_NUMBER) {
    const from = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')
      ? TWILIO_WHATSAPP_NUMBER
      : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;
    return { type: 'whatsapp', from };
  }
  return null;
}

async function sendCode(phone, code) {
  const channel = deliveryChannel();
  const body = `${code} is your VANLY verification code. It expires in 5 minutes. Never share this code.`;
  if (!channel) {
    if (process.env.NODE_ENV === 'production') {
      const err = new Error('SMS delivery is not configured');
      err.status = 503;
      throw err;
    }
    console.log(`[marketplace] DEV OTP for ${phone}: ${code}`);
    return { channel: 'dev', devCode: code };
  }
  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const to = channel.type === 'whatsapp' ? `whatsapp:${phone}` : phone;
  try {
    await twilio.messages.create({ from: channel.from, to, body });
  } catch (e) {
    // Never pass Twilio's own message to clients: it can contain the account SID and other internals.
    console.error('[marketplace] OTP send failed via Twilio', { code: e.code, status: e.status, message: e.message });
    const { HttpError } = require('./util');
    throw new HttpError(503, "We couldn't send your code right now. Please try again in a few minutes.", 'OTP_SEND_FAILED');
  }
  return { channel: channel.type };
}

/**
 * MARKETPLACE_PHONE_VERIFICATION=off switches phone verification off: no SMS is sent and the code is
 * handed straight back to the app, so anyone can sign in as any number. For testing (or an SMS outage
 * before there are real clients) only. Anything other than exactly "off" keeps verification on.
 */
function verificationRequired() {
  return String(process.env.MARKETPLACE_PHONE_VERIFICATION || '').trim().toLowerCase() !== 'off';
}

/**
 * Fixed test login (for your own testing and App Store / Play review).
 * Off unless BOTH MARKETPLACE_TEST_PHONE and MARKETPLACE_TEST_OTP (6 digits) are set.
 * Only that one number gets the fixed code; it is never sent by SMS, and the usual
 * expiry, attempt and hourly limits still apply.
 */
function testCodeFor(phone) {
  const testPhone = process.env.MARKETPLACE_TEST_PHONE;
  const testCode = String(process.env.MARKETPLACE_TEST_OTP || '').trim();
  if (!testPhone || !/^\d{6}$/.test(testCode)) return null;
  const { normalizeUaeMobile } = require('./phone');
  return normalizeUaeMobile(testPhone) === phone ? testCode : null;
}

module.exports = {
  testCodeFor,
  verificationRequired,
  OTP_TTL_MS,
  RESEND_AFTER_MS,
  MAX_ATTEMPTS,
  MAX_REQUESTS_PER_HOUR,
  generateCode,
  hashCode,
  safeEqual,
  sendCode,
};
