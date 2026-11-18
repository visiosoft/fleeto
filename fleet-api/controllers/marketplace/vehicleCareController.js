/**
 * "My Van": fuel log, odometer and issue reports for the renter's ACTIVE
 * booking. Entries are self-reported and stored as such; they are not
 * verified fuel consumption or GPS mileage.
 */
const { col, audit } = require('../../services/marketplace/store');
const { HttpError, handle, cleanString } = require('../../services/marketplace/util');
const { findOwnBooking } = require('./bookingController');
const { makeUploader, runUpload, storedFile } = require('./documentController');

const ACTIVE_STATUSES = ['active', 'overdue'];
const ISSUE_CATEGORIES = ['mechanical', 'tyre', 'accident', 'warning_light', 'damage', 'other'];
const SEVERITIES = ['low', 'medium', 'high'];

async function activeBooking(req) {
  const booking = await findOwnBooking(req);
  if (!ACTIVE_STATUSES.includes(booking.status)) {
    throw new HttpError(409, 'Vehicle logs open once the van has been handed over to you.', 'RENTAL_NOT_ACTIVE');
  }
  return booking;
}

function num(value) {
  if (value === undefined || value === null || value === '') return NaN;
  return Number(value);
}

function publicFuel(f) {
  return {
    id: f._id.toString(),
    litres: f.litres,
    amount: f.amount,
    odometer: f.odometer,
    fullTank: f.fullTank,
    fuelType: f.fuelType || '',
    hasReceipt: !!f.receipt,
    createdAt: f.createdAt,
  };
}

function publicIssue(i) {
  return {
    id: i._id.toString(),
    category: i.category,
    severity: i.severity,
    notes: i.notes,
    odometer: i.odometer ?? null,
    photoCount: (i.photos || []).length,
    status: i.status,
    createdAt: i.createdAt,
  };
}

exports.uploadReceipt = runUpload(makeUploader('receipts').single('receipt'));
exports.uploadIssuePhotos = runUpload(makeUploader('issues', { maxFiles: 4 }).array('photos', 4));

exports.summary = handle(async (req, res) => {
  const booking = await findOwnBooking(req);
  const fuel = await col('fuelEntries');
  const entries = await fuel.find({ bookingId: booking._id.toString() }).sort({ createdAt: -1 }).toArray();
  const odometers = entries.map((e) => e.odometer).filter((n) => Number.isFinite(n));
  res.json({
    status: 'success',
    data: {
      bookingStatus: booking.status,
      logsOpen: ACTIVE_STATUSES.includes(booking.status),
      fuelSpent: Math.round(entries.reduce((s, e) => s + (e.amount || 0), 0) * 100) / 100,
      litres: Math.round(entries.reduce((s, e) => s + (e.litres || 0), 0) * 100) / 100,
      lastOdometer: odometers.length ? Math.max(...odometers) : null,
      loggedDistance: odometers.length > 1 ? Math.max(...odometers) - Math.min(...odometers) : 0,
      entryCount: entries.length,
    },
  });
});

exports.listFuel = handle(async (req, res) => {
  const booking = await findOwnBooking(req);
  const fuel = await col('fuelEntries');
  const rows = await fuel.find({ bookingId: booking._id.toString() }).sort({ createdAt: -1 }).limit(200).toArray();
  res.json({ status: 'success', data: { entries: rows.map(publicFuel) } });
});

exports.createFuel = handle(async (req, res) => {
  const booking = await activeBooking(req);
  const litres = num(req.body?.litres);
  const amount = num(req.body?.amount);
  const odometer = num(req.body?.odometer);
  if (!(litres > 0 && litres <= 200)) throw new HttpError(400, 'Litres must be between 0 and 200');
  if (!(amount > 0 && amount <= 2000)) throw new HttpError(400, 'Amount must be between AED 0 and 2,000');
  if (!(Number.isInteger(odometer) && odometer >= 0 && odometer < 2000000)) throw new HttpError(400, 'Enter the odometer reading in whole km');

  const fuel = await col('fuelEntries');
  const [last] = await fuel.find({ bookingId: booking._id.toString() }).sort({ odometer: -1 }).limit(1).toArray();
  if (last && odometer < last.odometer) {
    throw new HttpError(400, `Odometer cannot be lower than your last entry (${last.odometer.toLocaleString('en-US')} km)`);
  }

  const doc = {
    bookingId: booking._id.toString(),
    customerId: booking.customerId,
    listingId: booking.listingId,
    vehicleId: booking.vehicleId,
    supplierOrgId: booking.supplierOrgId,
    litres: Math.round(litres * 100) / 100,
    amount: Math.round(amount * 100) / 100,
    odometer,
    fullTank: ['true', true, '1', 1].includes(req.body?.fullTank),
    fuelType: cleanString(req.body?.fuelType, 20) || '',
    receipt: storedFile(req.file),
    source: 'driver_reported',
    createdAt: new Date(),
  };
  const { insertedId } = await fuel.insertOne(doc);
  await audit('fuel.logged', { customerId: booking.customerId }, { bookingId: booking._id, fuelEntryId: insertedId });
  res.status(201).json({ status: 'success', data: { entry: publicFuel({ ...doc, _id: insertedId }) } });
});

exports.listIssues = handle(async (req, res) => {
  const booking = await findOwnBooking(req);
  const issues = await col('issues');
  const rows = await issues.find({ bookingId: booking._id.toString() }).sort({ createdAt: -1 }).limit(100).toArray();
  res.json({ status: 'success', data: { issues: rows.map(publicIssue) } });
});

exports.createIssue = handle(async (req, res) => {
  const booking = await activeBooking(req);
  const category = req.body?.category;
  const severity = req.body?.severity || 'medium';
  const notes = cleanString(req.body?.notes, 1000);
  if (!ISSUE_CATEGORIES.includes(category)) throw new HttpError(400, 'Choose what kind of issue this is');
  if (!SEVERITIES.includes(severity)) throw new HttpError(400, 'Choose how serious it is');
  if (!notes || notes.length < 5) throw new HttpError(400, 'Tell us briefly what happened');
  const odometer = num(req.body?.odometer);

  const doc = {
    bookingId: booking._id.toString(),
    customerId: booking.customerId,
    listingId: booking.listingId,
    vehicleId: booking.vehicleId,
    supplierOrgId: booking.supplierOrgId,
    category,
    severity,
    notes,
    odometer: Number.isInteger(odometer) && odometer >= 0 ? odometer : null,
    photos: (req.files || []).map(storedFile),
    status: 'open',
    createdAt: new Date(),
  };
  const issues = await col('issues');
  const { insertedId } = await issues.insertOne(doc);
  await audit('issue.reported', { customerId: booking.customerId }, { bookingId: booking._id, issueId: insertedId, severity });
  res.status(201).json({ status: 'success', data: { issue: publicIssue({ ...doc, _id: insertedId }) } });
});

exports.ISSUE_CATEGORIES = ISSUE_CATEGORIES;
