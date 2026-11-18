/**
 * Staff (web admin) side of a marketplace booking's life:
 * create a booking for a client by phone, view it, record offline payments,
 * dispatch a fleet vehicle (contract starts), take it back (contract ends).
 * Every query is scoped to the staff member's company (req.user.companyId).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { col, fleet, audit } = require('../../services/marketplace/store');
const { quoteFor } = require('../../services/marketplace/quoteService');
const couponsSvc = require('../../services/marketplace/coupons');
const pay = require('../../services/marketplace/payments');
const { normalizeUaeMobile } = require('../../services/marketplace/phone');
const { toId, HttpError, handle, cleanString, publicCustomer } = require('../../services/marketplace/util');
const { overlapping } = require('./listingController');
const { notifyLater } = require('../../services/marketplace/notify');
const billing = require('../../services/marketplace/billing');
const hold = require('../../services/marketplace/depositHold');
const { publicBooking } = require('./bookingController');
const { verificationSummary, documentsReady, UPLOAD_ROOT } = require('./documentController');

const INITIAL_STATUSES = ['pending_verification', 'approved', 'payment_pending'];
const FUEL_LEVELS = ['empty', '1/4', '1/2', '3/4', 'full'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card_terminal', 'cheque', 'other'];
const FIRST_PAYMENT_STATUSES = ['approved', 'contract_pending', 'payment_pending'];
const LATER_PAYMENT_STATUSES = ['confirmed', 'handover_pending', 'active', 'overdue', 'return_pending', 'inspection_pending'];

function orgId(req) {
  const id = req.user?.companyId;
  if (!id) throw new HttpError(403, 'Company account required');
  return id.toString();
}

async function ownBooking(req) {
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Booking not found');
  const bookings = await col('bookings');
  const booking = await bookings.findOne({ _id, supplierOrgId: orgId(req) });
  if (!booking) throw new HttpError(404, 'Booking not found');
  return booking;
}

function reference() {
  return `VN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function staffBooking(b, customer) {
  return {
    ...publicBooking(b),
    source: b.source || 'app',
    customer: customer
      ? { ...publicCustomer(customer), phone: customer.phone, appActivated: !!customer.phoneVerifiedAt }
      : { id: b.customerId },
    handover: b.handover || null,
    returnInspection: b.returnInspection || null,
    depositDetail: b.deposit || null,
    depositRefundRequest: hold.publicRequest(b.depositRefundRequest, { staff: true }),
  };
}

async function loadCustomer(id) {
  const _id = toId(id);
  if (!_id) return null;
  const customers = await col('customers');
  return customers.findOne({ _id });
}

/** POST /admin/bookings - book a van for a client identified by phone. */
exports.create = handle(async (req, res) => {
  const body = req.body || {};
  const org = orgId(req);
  const phone = normalizeUaeMobile(body.phone);
  if (!phone) throw new HttpError(400, 'Enter the client\'s UAE mobile number, e.g. 050 123 4567', 'INVALID_PHONE');
  const fullName = cleanString(body.fullName, 80);
  if (!fullName || fullName.length < 2) throw new HttpError(400, 'Enter the client\'s full name');
  const status = body.status || 'approved';
  if (!INITIAL_STATUSES.includes(status)) throw new HttpError(400, `status must be one of ${INITIAL_STATUSES.join(', ')}`);

  const listingId = toId(body.listingId);
  const listings = await col('listings');
  const listing = listingId ? await listings.findOne({ _id: listingId, organizationId: org }) : null;
  if (!listing) throw new HttpError(404, 'Choose one of your vans');

  const { error, quote, coupon, couponError } = await quoteFor(listing, body);
  if (error) throw new HttpError(400, error, 'INVALID_QUOTE');
  if (couponError) throw new HttpError(400, couponError, 'INVALID_COUPON');
  let paymentTerms;
  try {
    paymentTerms = pay.normalizeTerms(body.paymentTerms || {});
  } catch (err) {
    throw new HttpError(400, err.message);
  }
  let deliveryAddress = null;
  if (quote.fulfilment === 'delivery') {
    deliveryAddress = cleanString(body.deliveryAddress, 300);
    if (!deliveryAddress || deliveryAddress.length < 6) {
      throw new HttpError(400, quote.driver === 'with_driver' ? 'Enter where the driver should report' : 'Enter the delivery address');
    }
  }
  if ((await overlapping(listing._id, quote.startDate, quote.endDate)).length) {
    throw new HttpError(409, 'This van is already booked for those dates.', 'NOT_AVAILABLE');
  }

  // Find or create the client's account by phone. They activate it by logging in with OTP.
  const customers = await col('customers');
  const now = new Date();
  let customer = await customers.findOne({ phone });
  if (customer?.status === 'blocked') throw new HttpError(409, 'This client\'s account is blocked.');
  if (!customer) {
    const { insertedId } = await customers.insertOne({
      phone,
      isGuest: false,
      fullName,
      businessName: cleanString(body.businessName, 120) || '',
      email: (cleanString(body.email, 120) || '').toLowerCase(),
      status: 'active',
      phoneVerifiedAt: null,
      createdByStaff: { userId: req.user.userId, organizationId: org },
      createdAt: now,
      updatedAt: now,
    });
    customer = await customers.findOne({ _id: insertedId });
    await audit('customer.created_by_staff', { userId: req.user.userId, organizationId: org }, { customerId: insertedId, phone });
  } else {
    // Fill gaps only; never overwrite what the client entered themselves.
    const fill = {};
    if (!customer.fullName) fill.fullName = fullName;
    if (!customer.businessName && cleanString(body.businessName, 120)) fill.businessName = cleanString(body.businessName, 120);
    if (!customer.email && cleanString(body.email, 120)) fill.email = cleanString(body.email, 120).toLowerCase();
    if (Object.keys(fill).length) {
      await customers.updateOne({ _id: customer._id }, { $set: { ...fill, updatedAt: now } });
      customer = { ...customer, ...fill };
    }
  }

  const history = [{ status: 'pending_verification', at: now, by: `staff:${req.user.userId}`, note: 'Booked by staff' }];
  if (status !== 'pending_verification') history.push({ status, at: now, by: `staff:${req.user.userId}`, note: 'Set when booking was created' });
  const bookings = await col('bookings');
  const doc = {
    reference: reference(),
    customerId: customer._id.toString(),
    listingId: listing._id.toString(),
    supplierOrgId: org,
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
    status,
    statusHistory: history,
    requests: [],
    paymentTerms,
    installments: pay.buildSchedule(quote, paymentTerms),
    source: 'admin',
    createdBy: { userId: req.user.userId },
    createdAt: now,
    updatedAt: now,
  };
  if (coupon && !(await couponsSvc.consume(coupon))) throw new HttpError(409, 'This coupon has just been fully used.', 'INVALID_COUPON');
  const { insertedId } = await bookings.insertOne(doc);
  await audit('booking.created_by_staff', { userId: req.user.userId, organizationId: org }, { bookingId: insertedId, customerId: doc.customerId, quote });
  const upfront = doc.installments.find((i) => i.upfront);
  const payNow = upfront
    ? `Please pay AED ${upfront.total.toLocaleString('en-US')} (${pay.instLabel(upfront).toLowerCase()}) in the app to confirm.`
    : 'Please add your card in the app to confirm it.';
  const nextStep = {
    pending_verification: 'Please upload your trade licence and ID in the app so we can approve it.',
    approved: 'We will share the rental agreement and payment details next.',
    payment_pending: payNow,
  }[status];
  notifyLater({ ...doc, _id: insertedId }, 'booked_for_you', { nextStep });
  res.status(201).json({ status: 'success', data: { booking: staffBooking({ ...doc, _id: insertedId }, customer) } });
});

/** GET /admin/bookings/:id - everything staff need on one screen. */
exports.get = handle(async (req, res) => {
  const booking = await ownBooking(req);
  const customer = await loadCustomer(booking.customerId);
  const verification = await verificationSummary(booking.customerId);
  const payments = await col('payments');
  const paymentRows = await payments.find({ bookingId: booking._id.toString() }).sort({ createdAt: -1 }).toArray();
  const notifications = await col('notifications');
  const messages = await notifications.find({ bookingId: booking._id.toString() }).sort({ createdAt: -1 }).limit(50).toArray();
  res.json({
    status: 'success',
    data: {
      booking: staffBooking(booking, customer),
      verification,
      payments: paymentRows.map((p) => ({
        id: p._id.toString(), installment: p.installment, amount: p.amount, status: p.status,
        method: p.method || 'stripe', reference: p.reference || p.paymentIntentId || '', createdAt: p.createdAt,
      })),
      messages: messages.map((m) => ({
        id: m._id.toString(), event: m.event, status: m.status, channel: m.channel || null, body: m.body || '', error: m.error || '', createdAt: m.createdAt,
      })),
    },
  });
});

/** GET /admin/documents/:id/file - view a client document (only clients who booked with this company). */
exports.documentFile = handle(async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Document not found');
  const documents = await col('documents');
  const doc = await documents.findOne({ _id });
  if (!doc?.file) throw new HttpError(404, 'Document not found');
  const bookings = await col('bookings');
  if (!(await bookings.findOne({ supplierOrgId: orgId(req), customerId: doc.customerId }))) throw new HttpError(404, 'Document not found');
  const full = path.resolve(UPLOAD_ROOT, doc.file.path);
  if (!full.startsWith(path.resolve(UPLOAD_ROOT)) || !fs.existsSync(full)) throw new HttpError(404, 'File missing');
  res.setHeader('Content-Type', doc.file.mimeType);
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(full);
});

/** POST /admin/bookings/:id/payments - record a cash / bank transfer / card-machine payment. */
exports.recordPayment = handle(async (req, res) => {
  const booking = await ownBooking(req);
  const method = req.body?.method;
  if (!PAYMENT_METHODS.includes(method)) throw new HttpError(400, `method must be one of ${PAYMENT_METHODS.join(', ')}`);
  const referenceNo = cleanString(req.body?.reference, 120) || '';
  if (method !== 'cash' && !referenceNo) throw new HttpError(400, 'Add the transfer / receipt reference');

  let schedule = pay.scheduleOf(booking);
  let inst = schedule.find((i) => i.status !== 'paid');
  if (!inst) throw new HttpError(409, 'This booking is fully paid.');
  if (req.body?.includeCharges !== false && !inst.upfront && LATER_PAYMENT_STATUSES.includes(booking.status)) {
    // Salik / fines are collected together with this payment unless staff opt out.
    schedule = pay.scheduleOf(await billing.attachCharges(booking._id, inst.n));
    inst = schedule.find((i) => i.n === inst.n);
  }
  if (inst.upfront && !FIRST_PAYMENT_STATUSES.includes(booking.status)) throw new HttpError(409, `Cannot take the first payment on a ${booking.status} booking.`);
  if (!inst.upfront && !LATER_PAYMENT_STATUSES.includes(booking.status)) {
    throw new HttpError(409, FIRST_PAYMENT_STATUSES.includes(booking.status) ? 'Confirm the booking first - this payment is due later.' : `Cannot take payments on a ${booking.status} booking.`);
  }
  await billing.applyPayment(booking, inst.n, { method, reference: referenceNo, note: cleanString(req.body?.note, 300) || '', by: `staff:${req.user.userId}`, amount: inst.total });
  const bookings = await col('bookings');
  const updated = await bookings.findOne({ _id: booking._id });
  res.status(201).json({ status: 'success', data: { booking: staffBooking(updated, await loadCustomer(booking.customerId)) } });
});

async function findFleetVehicle(vehicleId, org) {
  const vehicles = await fleet('vehicles');
  const _id = toId(vehicleId);
  if (!_id) return null;
  const orgIds = [org];
  if (ObjectId.isValid(org) && org.length === 24) orgIds.push(new ObjectId(org));
  return vehicles.findOne({ _id, companyId: { $in: orgIds } });
}

/** POST /admin/bookings/:id/dispatch - hand over a fleet vehicle; the contract starts. */
exports.dispatch = handle(async (req, res) => {
  const booking = await ownBooking(req);
  if (!['confirmed', 'handover_pending'].includes(booking.status)) {
    throw new HttpError(409, booking.status === 'payment_pending' ? 'Take the first payment before dispatching.' : `Cannot dispatch a ${booking.status} booking.`, 'NOT_DISPATCHABLE');
  }
  const body = req.body || {};
  // Documents are collected after payment, so check them here: no van leaves without approved documents
  // unless staff deliberately override (e.g. checked in person at the branch).
  const docs = await documentsReady(booking);
  if (!docs.ready && body.overrideDocuments !== true) {
    const list = docs.missing.map((m) => `${m.label} (${m.status === 'missing' ? 'not uploaded' : m.status.replace('_', ' ')})`).join(', ');
    throw new HttpError(409, `The client's documents aren't approved yet: ${list || 'no documents on file'}.`, 'DOCUMENTS_PENDING', { missing: docs.missing });
  }
  const vehicle = await findFleetVehicle(body.vehicleId, booking.supplierOrgId);
  if (!vehicle) throw new HttpError(400, 'Choose one of your fleet vehicles');
  const odometer = Number(body.odometer);
  if (!Number.isInteger(odometer) || odometer < 0) throw new HttpError(400, 'Enter the odometer reading at handover');
  if (!FUEL_LEVELS.includes(body.fuelLevel)) throw new HttpError(400, `fuelLevel must be one of ${FUEL_LEVELS.join(', ')}`);
  const withDriver = booking.quote?.driver === 'with_driver';
  const driverName = cleanString(body.driverName, 80) || '';
  const driverPhone = cleanString(body.driverPhone, 20) || '';
  if (withDriver && !driverName) throw new HttpError(400, 'Enter the driver assigned to this booking');

  // The same fleet vehicle can't be out on two live bookings.
  const bookings = await col('bookings');
  const clash = await bookings.findOne({
    supplierOrgId: booking.supplierOrgId,
    'handover.vehicle.id': vehicle._id.toString(),
    status: { $in: ['active', 'overdue', 'return_pending'] },
  });
  if (clash) throw new HttpError(409, `${vehicle.licensePlate || 'This vehicle'} is still out on booking ${clash.reference}.`, 'VEHICLE_IN_USE');

  const now = new Date();
  const handover = {
    at: now,
    by: req.user.userId,
    vehicle: {
      id: vehicle._id.toString(),
      plate: vehicle.licensePlate || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || null,
    },
    odometer,
    fuelLevel: body.fuelLevel,
    notes: cleanString(body.notes, 500) || '',
    ...(withDriver ? { driver: { name: driverName, phone: driverPhone } } : {}),
    ...(!docs.ready ? { documentsOverridden: docs.missing.map((m) => m.type) } : {}),
  };
  await bookings.updateOne(
    { _id: booking._id },
    {
      $set: { status: 'active', handover, contractStartedAt: now, updatedAt: now },
      $push: { statusHistory: { status: 'active', at: now, by: `staff:${req.user.userId}`, note: `Dispatched ${handover.vehicle.plate}`.trim() } },
    }
  );
  await audit('booking.dispatched', { userId: req.user.userId, organizationId: booking.supplierOrgId }, { bookingId: booking._id, vehicleId: handover.vehicle.id, odometer });
  const updated = await bookings.findOne({ _id: booking._id });
  notifyLater(updated, 'dispatched', { plate: handover.vehicle.plate, make: handover.vehicle.make, model: handover.vehicle.model, driver: handover.driver?.name, driverPhone: handover.driver?.phone });
  res.json({ status: 'success', data: { booking: staffBooking(updated, await loadCustomer(booking.customerId)) } });
});

/** POST /admin/bookings/:id/return - vehicle back; the contract ends, inspection pending. */
exports.markReturned = handle(async (req, res) => {
  const booking = await ownBooking(req);
  if (!['active', 'overdue', 'return_pending'].includes(booking.status)) throw new HttpError(409, `Cannot return a ${booking.status} booking.`, 'NOT_RETURNABLE');
  const body = req.body || {};
  const odometer = Number(body.odometer);
  if (!Number.isInteger(odometer) || odometer < (booking.handover?.odometer || 0)) {
    throw new HttpError(400, `Enter the return odometer (at least ${booking.handover?.odometer || 0} km)`);
  }
  if (!FUEL_LEVELS.includes(body.fuelLevel)) throw new HttpError(400, `fuelLevel must be one of ${FUEL_LEVELS.join(', ')}`);
  const now = new Date();
  const returnInspection = {
    at: now,
    by: req.user.userId,
    odometer,
    distance: booking.handover ? odometer - booking.handover.odometer : null,
    fuelLevel: body.fuelLevel,
    damageNotes: cleanString(body.damageNotes, 1000) || '',
    notes: cleanString(body.notes, 500) || '',
  };
  const bookings = await col('bookings');
  await bookings.updateOne(
    { _id: booking._id },
    {
      $set: { status: 'inspection_pending', returnInspection, contractEndedAt: now, depositHold: hold.holdOnReturn(now), updatedAt: now },
      $push: { statusHistory: { status: 'inspection_pending', at: now, by: `staff:${req.user.userId}`, note: 'Vehicle returned' } },
    }
  );
  await audit('booking.returned', { userId: req.user.userId, organizationId: booking.supplierOrgId }, { bookingId: booking._id, odometer });
  const updated = await bookings.findOne({ _id: booking._id });
  notifyLater(updated, 'returned');
  res.json({ status: 'success', data: { booking: staffBooking(updated, await loadCustomer(booking.customerId)) } });
});

exports.staffBooking = staffBooking;
exports.loadCustomer = loadCustomer;
exports.FUEL_LEVELS = FUEL_LEVELS;
exports.PAYMENT_METHODS = PAYMENT_METHODS;
