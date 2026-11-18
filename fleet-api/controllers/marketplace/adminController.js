/**
 * Supplier (fleet company) side of the marketplace, using the existing staff
 * JWT. Everything is scoped to req.user.companyId: a company only sees and
 * changes its own listings, bookings and its renters' documents.
 */
const { col, audit } = require('../../services/marketplace/store');
const { toId, HttpError, handle, cleanString } = require('../../services/marketplace/util');
const { CATEGORIES, publicListing } = require('./listingController');
const { publicBooking } = require('./bookingController');
const { publicDocument, DOCUMENT_TYPES } = require('./documentController');
const { scheduleOf, readyToConfirm, termsOf, instLabel } = require('../../services/marketplace/payments');
const { notifyLater } = require('../../services/marketplace/notify');

const TRANSITIONS = {
  pending_verification: ['approved', 'rejected', 'cancelled'],
  approved: ['contract_pending', 'payment_pending', 'cancelled'],
  contract_pending: ['payment_pending', 'cancelled'],
  payment_pending: ['confirmed', 'cancelled', 'expired'],
  confirmed: ['handover_pending', 'cancelled'],
  handover_pending: ['active', 'cancelled'],
  active: ['return_pending', 'overdue'],
  overdue: ['return_pending'],
  return_pending: ['inspection_pending'],
  inspection_pending: ['closed', 'disputed'],
  disputed: ['closed'],
};

function orgId(req) {
  const id = req.user?.companyId;
  if (!id) throw new HttpError(403, 'Company account required');
  return id.toString();
}

function money(value, field, { optional = false } = {}) {
  if ((value === undefined || value === null || value === '') && optional) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new HttpError(400, `${field} must be a positive number`);
  return Math.round(n * 100) / 100;
}

/** Rates per plan; omit a plan to not offer it. At least one plan required. */
function planRates(rates, field) {
  const out = {};
  for (const plan of ['daily', 'weekly', 'monthly']) {
    const v = money(rates?.[plan], `${field}.${plan}`, { optional: true });
    if (v) out[plan] = v;
  }
  if (!Object.keys(out).length) throw new HttpError(400, `${field} needs at least one of daily, weekly, monthly`);
  return out;
}

function listingFields(body, { partial }) {
  const out = {};
  const str = (key, max) => {
    const v = cleanString(body[key], max);
    if (v !== undefined) out[key] = v;
  };
  str('title', 80);
  str('tagline', 120);
  str('description', 1500);
  str('city', 40);
  str('pickupBranch', 160);
  str('supplierName', 120);
  str('vehicleId', 40);
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) throw new HttpError(400, `category must be one of ${CATEGORIES.join(', ')}`);
    out.category = body.category;
  }
  if (body.rates !== undefined) out.rates = planRates(body.rates, 'rates');
  if (body.driverOption !== undefined) {
    const available = !!body.driverOption?.available;
    out.driverOption = { available, rates: available ? planRates(body.driverOption.rates, 'driverOption.rates') : {} };
  }
  if (body.deposit !== undefined) out.deposit = money(body.deposit, 'deposit');
  if (body.deliveryAvailable !== undefined) out.deliveryAvailable = !!body.deliveryAvailable;
  if (body.deliveryFee !== undefined) out.deliveryFee = money(body.deliveryFee, 'deliveryFee');
  if (body.excessKmRate !== undefined) out.excessKmRate = money(body.excessKmRate, 'excessKmRate');
  if (body.mileageAllowance !== undefined) {
    out.mileageAllowance = {
      daily: money(body.mileageAllowance?.daily, 'mileageAllowance.daily', { optional: true }) || 0,
      weekly: money(body.mileageAllowance?.weekly, 'mileageAllowance.weekly', { optional: true }) || 0,
      monthly: money(body.mileageAllowance?.monthly, 'mileageAllowance.monthly', { optional: true }) || 0,
    };
  }
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) throw new HttpError(400, 'images must be an array of URLs');
    // Absolute URLs, or photos served by this API under /api/marketplace/media/
    out.images = body.images
      .filter((u) => typeof u === 'string' && (/^https?:\/\//.test(u) || /^\/api\/marketplace\/media\/[\w./-]+$/.test(u)) && !u.includes('..'))
      .slice(0, 10);
  }
  if (body.specs !== undefined && typeof body.specs === 'object') {
    const s = body.specs;
    out.specs = {
      make: cleanString(s.make, 40) || '',
      model: cleanString(s.model, 40) || '',
      year: Number(s.year) || null,
      transmission: cleanString(s.transmission, 20) || '',
      fuelType: cleanString(s.fuelType, 20) || '',
      seats: Number(s.seats) || null,
      payloadKg: Number(s.payloadKg) || null,
      cargoVolumeM3: Number(s.cargoVolumeM3) || null,
      roof: cleanString(s.roof, 20) || '',
    };
  }
  if (body.policies !== undefined && typeof body.policies === 'object') {
    out.policies = {};
    for (const key of ['fuel', 'lateReturn', 'insurance', 'cancellation']) {
      const v = cleanString(body.policies[key], 500);
      if (v) out.policies[key] = v;
    }
  }
  if (body.status !== undefined) {
    if (!['active', 'hidden'].includes(body.status)) throw new HttpError(400, 'status must be active or hidden');
    out.status = body.status;
  }
  if (body.sortOrder !== undefined) out.sortOrder = Number(body.sortOrder) || 0;
  if (body.featured !== undefined) out.featured = !!body.featured;
  if (body.orSimilar !== undefined) out.orSimilar = !!body.orSimilar;

  if (!partial) {
    for (const key of ['title', 'category', 'city', 'rates', 'deposit']) {
      if (out[key] === undefined) throw new HttpError(400, `${key} is required`);
    }
    if (out.deliveryAvailable && out.deliveryFee === undefined) out.deliveryFee = 0;
  }
  return out;
}

exports.listListings = handle(async (req, res) => {
  const listings = await col('listings');
  const rows = await listings.find({ organizationId: orgId(req) }).sort({ createdAt: -1 }).toArray();
  res.json({ status: 'success', data: { listings: rows.map((l) => ({ ...publicListing(l), status: l.status, vehicleId: l.vehicleId || null, sortOrder: l.sortOrder || 0 })) } });
});

exports.createListing = handle(async (req, res) => {
  const fields = listingFields(req.body || {}, { partial: false });
  const now = new Date();
  const doc = { status: 'active', sortOrder: 0, ...fields, organizationId: orgId(req), createdAt: now, updatedAt: now };
  const listings = await col('listings');
  const { insertedId } = await listings.insertOne(doc);
  await audit('listing.created', { userId: req.user.userId, organizationId: doc.organizationId }, { listingId: insertedId });
  res.status(201).json({ status: 'success', data: { listing: { ...publicListing({ ...doc, _id: insertedId }), status: doc.status } } });
});

exports.updateListing = handle(async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Listing not found');
  const fields = listingFields(req.body || {}, { partial: true });
  const listings = await col('listings');
  const result = await listings.updateOne({ _id, organizationId: orgId(req) }, { $set: { ...fields, updatedAt: new Date() } });
  if (!result.matchedCount) throw new HttpError(404, 'Listing not found');
  const listing = await listings.findOne({ _id });
  res.json({ status: 'success', data: { listing: { ...publicListing(listing), status: listing.status } } });
});

exports.listBookings = handle(async (req, res) => {
  const query = { supplierOrgId: orgId(req) };
  if (typeof req.query.status === 'string' && TRANSITIONS[req.query.status] !== undefined) query.status = req.query.status;
  const bookings = await col('bookings');
  const rows = await bookings.find(query).sort({ createdAt: -1 }).limit(200).toArray();
  const customers = await col('customers');
  const ids = [...new Set(rows.map((b) => b.customerId))].map(toId).filter(Boolean);
  const people = ids.length ? await customers.find({ _id: { $in: ids } }).toArray() : [];
  const byId = Object.fromEntries(people.map((p) => [p._id.toString(), p]));
  res.json({
    status: 'success',
    data: {
      bookings: rows.map((b) => {
        const c = byId[b.customerId] || {};
        return {
          ...publicBooking(b),
          source: b.source || 'app',
          handover: b.handover || null,
          customer: { id: b.customerId, fullName: c.fullName || '', phone: c.phone || '', businessName: c.businessName || '', appActivated: !!c.phoneVerifiedAt },
        };
      }),
    },
  });
});

exports.updateBookingStatus = handle(async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Booking not found');
  const next = req.body?.status;
  const bookings = await col('bookings');
  const booking = await bookings.findOne({ _id, supplierOrgId: orgId(req) });
  if (!booking) throw new HttpError(404, 'Booking not found');
  const allowed = TRANSITIONS[booking.status] || [];
  if (next === 'active') throw new HttpError(409, 'Use Dispatch to hand over a vehicle - it records the plate, odometer and fuel.', 'USE_DISPATCH');
  if (next === 'inspection_pending') throw new HttpError(409, 'Use Mark returned - it records the return odometer and fuel.', 'USE_RETURN');
  if (next === 'confirmed' && !readyToConfirm(booking)) {
    const upfrontPaid = scheduleOf(booking).filter((i) => i.upfront).every((i) => i.status === 'paid');
    const onlyCardMissing = upfrontPaid && termsOf(booking).depositMode === 'card_on_file';
    const override = req.body?.override === true && (cleanString(req.body?.note, 300) || '').length >= 5;
    if (!(onlyCardMissing && override)) {
      throw new HttpError(409, onlyCardMissing
        ? 'The client has not saved a card for the deposit yet. Confirm anyway with a note if you accept that.'
        : 'A booking is confirmed automatically when its first payment is received.', onlyCardMissing ? 'CARD_REQUIRED' : 'PAYMENT_REQUIRED');
    }
  }
  if (!allowed.includes(next)) {
    throw new HttpError(409, `Cannot move a ${booking.status} booking to ${next}. Allowed: ${allowed.join(', ') || 'none'}`, 'INVALID_TRANSITION');
  }
  const now = new Date();
  const entry = { status: next, at: now, by: `staff:${req.user.userId}`, note: cleanString(req.body?.note, 300) || '' };
  await bookings.updateOne({ _id }, { $set: { status: next, updatedAt: now }, $push: { statusHistory: entry } });
  await audit('booking.status_changed', { userId: req.user.userId, organizationId: booking.supplierOrgId }, { bookingId: _id, from: booking.status, to: next });
  const updated = await bookings.findOne({ _id });
  const event = { approved: 'approved', payment_pending: 'payment_requested', rejected: 'rejected', cancelled: 'cancelled' }[next];
  if (event) {
    const upfront = scheduleOf(updated).find((i) => i.upfront && i.status !== 'paid');
    const terms = termsOf(updated);
    notifyLater(updated, event, {
      note: entry.note,
      amount: upfront?.total,
      label: upfront ? instLabel(upfront) : null,
      cardOnly: !upfront && (terms.depositMode === 'card_on_file' || terms.autoCharge) && !updated.card,
      auto: terms.autoCharge,
    });
  }
  res.json({ status: 'success', data: { booking: publicBooking(updated) } });
});

/** Documents of customers who have booked with this company. */
exports.listDocuments = handle(async (req, res) => {
  const bookings = await col('bookings');
  const mine = await bookings.find({ supplierOrgId: orgId(req) }).toArray();
  const customerIds = [...new Set(mine.map((b) => b.customerId))];
  const documents = await col('documents');
  const rows = customerIds.length ? await documents.find({ customerId: { $in: customerIds } }).sort({ createdAt: -1 }).toArray() : [];
  res.json({ status: 'success', data: { documents: rows.map((d) => ({ ...publicDocument(d), customerId: d.customerId })) } });
});

exports.reviewDocument = handle(async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Document not found');
  const status = req.body?.status;
  if (!['under_review', 'approved', 'rejected'].includes(status)) throw new HttpError(400, 'status must be under_review, approved or rejected');
  const documents = await col('documents');
  const doc = await documents.findOne({ _id });
  if (!doc || !DOCUMENT_TYPES[doc.type]) throw new HttpError(404, 'Document not found');
  const bookings = await col('bookings');
  const link = await bookings.findOne({ supplierOrgId: orgId(req), customerId: doc.customerId });
  if (!link) throw new HttpError(404, 'Document not found');
  const note = cleanString(req.body?.note, 300) || '';
  if (status === 'rejected' && !note) throw new HttpError(400, 'Add a note telling the customer what to fix');
  const now = new Date();
  await documents.updateOne({ _id }, { $set: { status, reviewNote: note, reviewedAt: now, reviewedBy: req.user.userId, updatedAt: now } });
  await audit('document.reviewed', { userId: req.user.userId, organizationId: orgId(req) }, { documentId: _id, status });
  if (status === 'rejected') notifyLater(link, 'document_rejected', { label: (DOCUMENT_TYPES[doc.type]?.label || 'document').toLowerCase(), note });
  res.json({ status: 'success', data: { document: publicDocument(await documents.findOne({ _id })) } });
});

exports.TRANSITIONS = TRANSITIONS;
