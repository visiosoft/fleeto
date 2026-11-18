/**
 * Staff: protection plans, duration packages and coupons for their company.
 *   GET   /admin/settings              -> { includedCover, protectionPlans, durations, isDefault }
 *   PUT   /admin/settings              <- any of the same fields
 *   GET   /admin/coupons
 *   POST  /admin/coupons               { code, type, value, scope?, validFrom?, validTo?, maxUses?, minMonths?, description?, active? }
 *   PATCH /admin/coupons/:id           same fields (code can't change once used)
 */
const { col, audit } = require('../../services/marketplace/store');
const settingsSvc = require('../../services/marketplace/settings');
const couponsSvc = require('../../services/marketplace/coupons');
const { toId, HttpError, handle } = require('../../services/marketplace/util');

function orgId(req) {
  const id = req.user?.companyId;
  if (!id) throw new HttpError(403, 'Company account required');
  return id.toString();
}

exports.getSettings = handle(async (req, res) => {
  res.json({ status: 'success', data: await settingsSvc.getSettings(orgId(req)) });
});

exports.saveSettings = handle(async (req, res) => {
  try {
    const saved = await settingsSvc.saveSettings(orgId(req), req.body || {}, req.user.userId);
    await audit('settings.saved', { userId: req.user.userId, organizationId: orgId(req) }, { keys: Object.keys(req.body || {}) });
    res.json({ status: 'success', data: saved });
  } catch (err) {
    throw new HttpError(err.status || 500, err.message);
  }
});

exports.listCoupons = handle(async (req, res) => {
  const coupons = await col('coupons');
  const rows = await coupons.find({ organizationId: orgId(req) }).sort({ createdAt: -1 }).toArray();
  res.json({ status: 'success', data: { coupons: rows.map(couponsSvc.publicCoupon) } });
});

exports.createCoupon = handle(async (req, res) => {
  const { errors, value } = couponsSvc.validate(req.body || {});
  if (errors.length) throw new HttpError(400, errors.join('; '));
  const coupons = await col('coupons');
  if (await coupons.findOne({ organizationId: orgId(req), code: value.code })) throw new HttpError(409, `Coupon ${value.code} already exists`);
  const doc = { ...value, organizationId: orgId(req), usedCount: 0, createdBy: req.user.userId, createdAt: new Date() };
  const { insertedId } = await coupons.insertOne(doc);
  await audit('coupon.created', { userId: req.user.userId, organizationId: orgId(req) }, { couponId: insertedId, code: value.code });
  res.status(201).json({ status: 'success', data: { coupon: couponsSvc.publicCoupon({ ...doc, _id: insertedId }) } });
});

exports.updateCoupon = handle(async (req, res) => {
  const _id = toId(req.params.id);
  const coupons = await col('coupons');
  const current = _id ? await coupons.findOne({ _id, organizationId: orgId(req) }) : null;
  if (!current) throw new HttpError(404, 'Coupon not found');
  const merged = { ...couponsSvc.publicCoupon(current), ...(req.body || {}) };
  const { errors, value } = couponsSvc.validate(merged);
  if (errors.length) throw new HttpError(400, errors.join('; '));
  if (value.code !== current.code && current.usedCount) throw new HttpError(409, 'The code can\'t change after the coupon has been used');
  await coupons.updateOne({ _id }, { $set: { ...value, updatedAt: new Date() } });
  await audit('coupon.updated', { userId: req.user.userId, organizationId: orgId(req) }, { couponId: _id });
  res.json({ status: 'success', data: { coupon: couponsSvc.publicCoupon(await coupons.findOne({ _id })) } });
});
