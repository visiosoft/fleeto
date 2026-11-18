/**
 * Marketplace customer auth: UAE phone + OTP, or guest browsing.
 * Guests can browse and get quotes; verifying a phone upgrades the same
 * guest record into a customer account.
 */
const { col, audit } = require('../../services/marketplace/store');
const { normalizeUaeMobile, maskPhone } = require('../../services/marketplace/phone');
const otp = require('../../services/marketplace/otp');
const { signCustomerToken } = require('../../services/marketplace/tokens');
const { resolveCustomer } = require('../../middleware/marketplaceAuth');
const { HttpError, handle, publicCustomer, cleanString } = require('../../services/marketplace/util');

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

exports.requestOtp = handle(async (req, res) => {
  const phone = normalizeUaeMobile(req.body?.phone);
  if (!phone) throw new HttpError(400, 'Enter a valid UAE mobile number, e.g. 050 123 4567', 'INVALID_PHONE');

  const otps = await col('otps');
  const now = Date.now();
  const recent = await otps
    .find({ phone, createdAt: { $gte: new Date(now - 60 * 60 * 1000) } })
    .sort({ createdAt: -1 })
    .toArray();

  if (recent.length >= otp.MAX_REQUESTS_PER_HOUR) {
    throw new HttpError(429, 'Too many codes requested. Please try again in an hour.', 'OTP_RATE_LIMIT');
  }
  if (recent[0] && now - recent[0].createdAt.getTime() < otp.RESEND_AFTER_MS) {
    const retryAfter = Math.ceil((otp.RESEND_AFTER_MS - (now - recent[0].createdAt.getTime())) / 1000);
    throw new HttpError(429, `Please wait ${retryAfter}s before requesting a new code.`, 'OTP_TOO_SOON', { retryAfter });
  }

  const testCode = otp.testCodeFor(phone);
  const code = testCode || otp.generateCode();
  const { insertedId } = await otps.insertOne({
    phone,
    codeHash: otp.hashCode(phone, code),
    attempts: 0,
    consumed: false,
    expiresAt: new Date(now + otp.OTP_TTL_MS),
    createdAt: new Date(now),
  });

  let delivery;
  try {
    // The test number is never texted; the tester already knows the code.
    if (testCode) delivery = { channel: 'sms' };
    // Verification switched off in .env: no SMS, the app gets the code and signs straight in.
    else if (!(await otp.verificationMode()).on) delivery = { channel: 'off', devCode: code };
    else delivery = await otp.sendCode(phone, code);
  } catch (err) {
    await otps.deleteOne({ _id: insertedId });
    if (err.status) throw err;
    console.error('[marketplace] OTP send failed', err.message);
    throw new HttpError(502, 'We could not send the code. Check the number and try again.', 'OTP_SEND_FAILED');
  }

  res.json({
    status: 'success',
    data: {
      phone,
      phoneMasked: maskPhone(phone),
      channel: delivery.channel,
      expiresIn: otp.OTP_TTL_MS / 1000,
      resendIn: otp.RESEND_AFTER_MS / 1000,
      ...(delivery.devCode ? { devCode: delivery.devCode } : {}),
    },
  });
});

/** GET /auth/status - is phone verification on? (Lets the app and support see the live setting.) */
exports.status = handle(async (req, res) => {
  const mode = await otp.verificationMode();
  res.json({ status: 'success', data: { phoneVerification: mode.on ? 'on' : 'off', source: mode.source } });
});

exports.verifyOtp = handle(async (req, res) => {
  const phone = normalizeUaeMobile(req.body?.phone);
  const code = String(req.body?.code || '').trim();
  if (!phone) throw new HttpError(400, 'Enter a valid UAE mobile number', 'INVALID_PHONE');
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, 'Enter the 6-digit code', 'INVALID_CODE');

  const otps = await col('otps');
  const [record] = await otps.find({ phone, consumed: false }).sort({ createdAt: -1 }).limit(1).toArray();
  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw new HttpError(400, 'This code has expired. Request a new one.', 'OTP_EXPIRED');
  }
  if (record.attempts >= otp.MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many wrong attempts. Request a new code.', 'OTP_LOCKED');
  }
  if (!otp.safeEqual(record.codeHash, otp.hashCode(phone, code))) {
    await otps.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    const attemptsLeft = otp.MAX_ATTEMPTS - record.attempts - 1;
    throw new HttpError(400, attemptsLeft > 0 ? `Incorrect code. ${attemptsLeft} attempts left.` : 'Incorrect code. Request a new one.', 'OTP_INCORRECT', { attemptsLeft });
  }
  await otps.updateOne({ _id: record._id }, { $set: { consumed: true, consumedAt: new Date() } });

  const customers = await col('customers');
  const now = new Date();
  let customer = await customers.findOne({ phone });
  let isNew = false;

  if (customer?.status === 'blocked') throw new HttpError(403, 'This account is not active. Contact support.', 'ACCOUNT_BLOCKED');

  if (!customer) {
    isNew = true;
    const guest = await resolveCustomer(req);
    const fullName = cleanString(req.body?.fullName, 80);
    if (guest && guest.isGuest) {
      // Upgrade the guest record in place so anything tied to it is kept.
      await customers.updateOne(
        { _id: guest._id },
        { $set: { phone, isGuest: false, phoneVerifiedAt: now, updatedAt: now, ...(fullName ? { fullName } : {}) } }
      );
      customer = await customers.findOne({ _id: guest._id });
      await audit('customer.guest_upgraded', { customerId: guest._id }, { phone });
    } else {
      const { insertedId } = await customers.insertOne({
        phone,
        isGuest: false,
        fullName: fullName || '',
        status: 'active',
        phoneVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      customer = await customers.findOne({ _id: insertedId });
      await audit('customer.registered', { customerId: insertedId }, { phone });
    }
  } else {
    await customers.updateOne({ _id: customer._id }, { $set: { lastLoginAt: now, ...(customer.phoneVerifiedAt ? {} : { phoneVerifiedAt: now }) } });
    if (!customer.phoneVerifiedAt) customer = { ...customer, phoneVerifiedAt: now };
  }

  res.json({ status: 'success', data: { token: signCustomerToken(customer), customer: publicCustomer(customer), isNew } });
});

exports.guest = handle(async (req, res) => {
  const customers = await col('customers');
  const now = new Date();
  const { insertedId } = await customers.insertOne({ isGuest: true, status: 'active', createdAt: now, updatedAt: now });
  const customer = await customers.findOne({ _id: insertedId });
  res.status(201).json({ status: 'success', data: { token: signCustomerToken(customer), customer: publicCustomer(customer) } });
});

exports.me = handle(async (req, res) => {
  res.json({ status: 'success', data: { customer: publicCustomer(req.customer) } });
});

exports.updateProfile = handle(async (req, res) => {
  const body = req.body || {};
  const update = {};
  const fullName = cleanString(body.fullName, 80);
  const businessName = cleanString(body.businessName, 120);
  const email = cleanString(body.email, 120);
  const emirate = cleanString(body.emirate, 40);

  if (fullName !== undefined) {
    if (fullName.length < 2) throw new HttpError(400, 'Enter your full name');
    update.fullName = fullName;
  }
  if (businessName !== undefined) update.businessName = businessName;
  if (email !== undefined) {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address');
    update.email = email.toLowerCase();
  }
  if (emirate !== undefined) {
    if (emirate && !EMIRATES.includes(emirate)) throw new HttpError(400, 'Choose a UAE emirate');
    update.emirate = emirate;
  }
  if (!Object.keys(update).length) throw new HttpError(400, 'Nothing to update');

  const customers = await col('customers');
  await customers.updateOne({ _id: req.customer._id }, { $set: { ...update, updatedAt: new Date() } });
  const customer = await customers.findOne({ _id: req.customer._id });
  res.json({ status: 'success', data: { customer: publicCustomer(customer) } });
});
