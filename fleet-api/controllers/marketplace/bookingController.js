/**
 * Customer bookings. Booking online goes straight to `payment_pending`: the client pays the
 * first month and deposit, which confirms the booking, and uploads documents after that.
 * Staff check the documents before dispatch (the dispatch endpoint enforces it).
 */
const crypto = require('crypto');
const { col, audit } = require('../../services/marketplace/store');
const { quoteFor } = require('../../services/marketplace/quoteService');
const couponsSvc = require('../../services/marketplace/coupons');
const { toId, HttpError, handle, cleanString } = require('../../services/marketplace/util');
const { findActiveListing, overlapping } = require('./listingController');
const { verificationSummary } = require('./documentController');
const { paymentSummary, buildSchedule, APP_BOOKING_TERMS } = require('../../services/marketplace/payments');
const { notifyLater } = require('../../services/marketplace/notify');

const CUSTOMER_CANCELLABLE = ['pending_verification', 'approved', 'contract_pending', 'payment_pending'];
const REQUESTABLE = ['confirmed', 'handover_pending', 'active', 'overdue'];

function reference() {
  return `VN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function publicBooking(b) {
  return {
    id: b._id.toString(),
    reference: b.reference,
    status: b.status,
    listingId: b.listingId,
    vehicle: b.listingSnapshot,
    quote: b.quote,
    fulfilment: b.fulfilment,
    driver: b.quote?.driver || 'self',
    deliveryAddress: b.deliveryAddress || null,
    notes: b.notes || '',
    requests: (b.requests || []).map((r) => ({ ...r, id: r.id })),
    statusHistory: (b.statusHistory || []).map((h) => ({ status: h.status, at: h.at, note: h.note || '' })),
    payment: paymentSummary(b),
    source: b.source || 'app',
    assignedVehicle: b.handover
      ? { plate: b.handover.vehicle?.plate || '', make: b.handover.vehicle?.make || '', model: b.handover.vehicle?.model || '', driver: b.handover.driver?.name || null, driverPhone: b.handover.driver?.phone || null }
      : null,
    contractStartedAt: b.contractStartedAt || null,
    contractEndedAt: b.contractEndedAt || null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

async function findOwnBooking(req) {
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Booking not found');
  const bookings = await col('bookings');
  const booking = await bookings.findOne({ _id, customerId: req.customer._id.toString() });
  if (!booking) throw new HttpError(404, 'Booking not found');
  return booking;
}

exports.create = handle(async (req, res) => {
  const body = req.body || {};
  const customerId = req.customer._id.toString();
  const bookings = await col('bookings');

  const idempotencyKey = cleanString(body.idempotencyKey, 64);
  if (idempotencyKey) {
    const existing = await bookings.findOne({ customerId, idempotencyKey });
    if (existing) return res.json({ status: 'success', data: { booking: publicBooking(existing) } });
  }

  const listing = await findActiveListing(body.listingId);
  const { error, quote, coupon, couponError } = await quoteFor(listing, body);
  if (error) throw new HttpError(400, error, 'INVALID_QUOTE');
  if (couponError) throw new HttpError(400, couponError, 'INVALID_COUPON');

  let deliveryAddress = null;
  if (quote.fulfilment === 'delivery') {
    deliveryAddress = cleanString(body.deliveryAddress, 300);
    if (!deliveryAddress || deliveryAddress.length < 6) {
      const what = quote.driver === 'with_driver' ? 'the address where the driver should report' : 'the delivery address';
      throw new HttpError(400, `Enter ${what}`, 'DELIVERY_ADDRESS_REQUIRED');
    }
  }

  if ((await overlapping(listing._id, quote.startDate, quote.endDate)).length) {
    throw new HttpError(409, 'This van is already booked for those dates. Try another start date.', 'NOT_AVAILABLE');
  }

  const now = new Date();
  const doc = {
    reference: reference(),
    customerId,
    listingId: listing._id.toString(),
    supplierOrgId: listing.organizationId || null,
    vehicleId: listing.vehicleId || null,
    listingSnapshot: {
      title: listing.title,
      category: listing.category,
      seats: listing.specs?.seats || null,
      image: listing.images?.[0] || null,
      pickupBranch: listing.pickupBranch || '',
      city: listing.city,
      supplierName: listing.supplierName || '',
    },
    quote,
    fulfilment: quote.fulfilment,
    deliveryAddress,
    notes: cleanString(body.notes, 500) || '',
    status: 'payment_pending',
    statusHistory: [{ status: 'payment_pending', at: now, by: 'customer', note: 'Booked in app; payment due' }],
    paymentTerms: { ...APP_BOOKING_TERMS },
    installments: buildSchedule(quote, APP_BOOKING_TERMS),
    requests: [],
    ...(idempotencyKey ? { idempotencyKey } : {}),
    createdAt: now,
    updatedAt: now,
  };
  if (coupon && !(await couponsSvc.consume(coupon))) throw new HttpError(409, 'This coupon has just been fully used.', 'INVALID_COUPON');
  const { insertedId } = await bookings.insertOne(doc);

  // Guard against two requests racing past the check above: the earliest
  // booking wins, later ones are cancelled.
  const clashes = await overlapping(listing._id, quote.startDate, quote.endDate, insertedId);
  if (clashes.some((c) => c.createdAt < now || (c.createdAt.getTime() === now.getTime() && c._id.toString() < insertedId.toString()))) {
    await bookings.updateOne(
      { _id: insertedId },
      { $set: { status: 'cancelled', updatedAt: new Date() }, $push: { statusHistory: { status: 'cancelled', at: new Date(), by: 'system', note: 'Dates taken by another booking' } } }
    );
    throw new HttpError(409, 'This van was just booked for those dates. Try another start date.', 'NOT_AVAILABLE');
  }

  await audit('booking.created', { customerId }, { bookingId: insertedId, listingId: doc.listingId, quote });
  const booking = await bookings.findOne({ _id: insertedId });
  notifyLater(booking, 'booking_received');
  res.status(201).json({ status: 'success', data: { booking: publicBooking(booking) } });
});

exports.list = handle(async (req, res) => {
  const bookings = await col('bookings');
  const rows = await bookings.find({ customerId: req.customer._id.toString() }).sort({ createdAt: -1 }).limit(100).toArray();
  res.json({ status: 'success', data: { bookings: rows.map(publicBooking) } });
});

exports.get = handle(async (req, res) => {
  const booking = await findOwnBooking(req);
  const verification = await verificationSummary(req.customer._id.toString());
  res.json({ status: 'success', data: { booking: publicBooking(booking), verification } });
});

exports.cancel = handle(async (req, res) => {
  const booking = await findOwnBooking(req);
  if (!CUSTOMER_CANCELLABLE.includes(booking.status)) {
    throw new HttpError(409, 'This booking can no longer be cancelled in the app. Contact the provider.', 'NOT_CANCELLABLE');
  }
  const bookings = await col('bookings');
  const now = new Date();
  await bookings.updateOne(
    { _id: booking._id },
    { $set: { status: 'cancelled', updatedAt: now }, $push: { statusHistory: { status: 'cancelled', at: now, by: 'customer' } } }
  );
  await audit('booking.cancelled', { customerId: booking.customerId }, { bookingId: booking._id });
  res.json({ status: 'success', data: { booking: publicBooking(await bookings.findOne({ _id: booking._id })) } });
});

/** Extension or return request. The provider approves it; dates do not change here. */
exports.createRequest = handle(async (req, res) => {
  const booking = await findOwnBooking(req);
  const type = req.body?.type;
  if (!['extension', 'return'].includes(type)) throw new HttpError(400, 'type must be extension or return');
  if (!REQUESTABLE.includes(booking.status)) {
    throw new HttpError(409, 'Requests are available once the rental is confirmed.', 'NOT_REQUESTABLE');
  }
  const preferredDate = cleanString(req.body?.preferredDate, 10);
  if (!preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) throw new HttpError(400, 'Choose a date');
  if (type === 'extension' && preferredDate <= booking.quote.endDate) {
    throw new HttpError(400, 'Extension date must be after the current return date');
  }
  if ((booking.requests || []).some((r) => r.type === type && r.status === 'requested')) {
    throw new HttpError(409, `You already have an open ${type} request.`);
  }
  const request = {
    id: crypto.randomBytes(6).toString('hex'),
    type,
    preferredDate,
    notes: cleanString(req.body?.notes, 500) || '',
    status: 'requested',
    createdAt: new Date(),
  };
  const bookings = await col('bookings');
  await bookings.updateOne({ _id: booking._id }, { $push: { requests: request }, $set: { updatedAt: new Date() } });
  await audit(`booking.${type}_requested`, { customerId: booking.customerId }, { bookingId: booking._id, request });
  res.status(201).json({ status: 'success', data: { booking: publicBooking(await bookings.findOne({ _id: booking._id })) } });
});

exports.publicBooking = publicBooking;
exports.findOwnBooking = findOwnBooking;
