/**
 * Staff: Salik, traffic fines and other recharges on a booking.
 *   POST /admin/bookings/:id/charges                       add one { type, description, amount, adminFee?, occurredAt?, reference? }
 *   POST /admin/bookings/:id/charges/import-fines          pull RTA fines for the dispatched plate during the hire { adminFee? }
 *   POST /admin/bookings/:id/charges/:chargeId/waive       { note }
 *   POST /admin/bookings/:id/charges/bill                  put pending charges on the next payment (or a new one, due today)
 */
const { col, fleet, audit } = require('../../services/marketplace/store');
const pay = require('../../services/marketplace/payments');
const extra = require('../../services/marketplace/charges');
const billing = require('../../services/marketplace/billing');
const { toId, HttpError, handle, cleanString } = require('../../services/marketplace/util');
const { normalisePlate, plateMatches, parseFineAmount } = require('../../utils/plateMatch');
const { parseFineDateTime } = require('../../utils/fineDate');

const CHARGEABLE = ['active', 'overdue', 'return_pending', 'inspection_pending', 'closed', 'disputed'];

async function staffBooking(req) {
  const org = req.user?.companyId?.toString();
  if (!org) throw new HttpError(403, 'Company account required');
  const _id = toId(req.params.id);
  if (!_id) throw new HttpError(404, 'Booking not found');
  const bookings = await col('bookings');
  const booking = await bookings.findOne({ _id, supplierOrgId: org });
  if (!booking) throw new HttpError(404, 'Booking not found');
  return booking;
}

async function respond(res, bookingId, extraData = {}) {
  const { staffBooking: shape, loadCustomer } = require('./adminBookingController'); // lazy: avoids a require cycle
  const bookings = await col('bookings');
  const b = await bookings.findOne({ _id: bookingId });
  res.json({ status: 'success', data: { booking: shape(b, await loadCustomer(b.customerId)), ...extraData } });
}

function todayDubai() {
  return new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
}

function money(v, field, { allowZero = false } = {}) {
  const n = Math.round(Number(v) * 100) / 100;
  if (!Number.isFinite(n) || n < 0 || (!allowZero && n === 0)) throw new HttpError(400, `${field} must be ${allowZero ? '0 or more' : 'more than 0'}`);
  if (n > 50000) throw new HttpError(400, `${field} looks too large`);
  return n;
}

exports.add = handle(async (req, res) => {
  const booking = await staffBooking(req);
  if (!CHARGEABLE.includes(booking.status)) throw new HttpError(409, 'Charges can be added once the van is on hire.', 'NOT_ON_HIRE');
  const b = req.body || {};
  if (!extra.TYPES[b.type]) throw new HttpError(400, 'type must be salik, fine or other');
  const description = cleanString(b.description, 160);
  if (!description || description.length < 3) throw new HttpError(400, 'Describe the charge (e.g. "Salik 1-31 Dec, 46 trips")');
  let occurredAt = null;
  if (b.occurredAt) {
    occurredAt = new Date(b.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) throw new HttpError(400, 'occurredAt must be a date');
  }
  const charge = extra.makeCharge({
    type: b.type, description, reference: cleanString(b.reference, 80), occurredAt,
    amount: money(b.amount, 'amount'), adminFee: money(b.adminFee || 0, 'adminFee', { allowZero: true }), by: `staff:${req.user.userId}`,
  });
  const bookings = await col('bookings');
  await bookings.updateOne({ _id: booking._id }, { $push: { charges: charge }, $set: { updatedAt: new Date() } });
  await audit('charge.added', { userId: req.user.userId }, { bookingId: booking._id, chargeId: charge.id, type: charge.type, total: charge.total });
  await respond(res, booking._id);
});

/** Pull RTA fines on the dispatched plate dated between handover and return (or today). */
exports.importFines = handle(async (req, res) => {
  const booking = await staffBooking(req);
  const plate = normalisePlate(booking.handover?.vehicle?.plate);
  if (!plate) throw new HttpError(409, 'Dispatch a vehicle first - fines are matched by its plate.', 'NOT_DISPATCHED');

  const companies = await fleet('companies');
  const company = await companies.findOne({ _id: toId(booking.supplierOrgId) || booking.supplierOrgId });
  if (!company?.tcNumber) throw new HttpError(409, 'Set your RTA traffic file (TC) number in company settings to import fines.', 'NO_TC_NUMBER');

  const dubaiDay = (d) => new Date(new Date(d).getTime() + 4 * 3600e3).toISOString().slice(0, 10);
  const from = dubaiDay(booking.contractStartedAt || booking.handover.at);
  const to = dubaiDay(booking.contractEndedAt || booking.returnInspection?.at || Date.now());
  const adminFee = money(req.body?.adminFee || 0, 'adminFee', { allowZero: true });

  const rta = await fleet('rta_fines');
  const fines = await rta.find({ traffic_file_key: company.tcNumber }).toArray();
  const already = new Set((booking.charges || []).map((c) => c.sourceId).filter(Boolean));
  const added = [];
  const skipped = { otherPlate: 0, outsideDates: 0, alreadyAdded: 0 };
  for (const f of fines) {
    if (!plateMatches(normalisePlate(f.number_plate), plate)) { skipped.otherPlate += 1; continue; }
    const ms = parseFineDateTime(f.date_time);
    if (!ms) { skipped.outsideDates += 1; continue; }
    const dt = new Date(ms);
    // date_time is Dubai local time parsed as server-local; compare by calendar day
    const day = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    if (day < from || day > to) { skipped.outsideDates += 1; continue; }
    const sourceId = f._id.toString();
    if (already.has(sourceId)) { skipped.alreadyAdded += 1; continue; }
    const amount = parseFineAmount(f.amount);
    if (!amount) continue;
    added.push(extra.makeCharge({
      type: 'fine', description: `${f.source || 'RTA fine'} - ${f.date_time}`.replace(/\s+/g, ' ').trim(), reference: String(f.number_plate || '').replace(/\s+/g, ' '),
      occurredAt: dt, amount, adminFee, source: 'rta_import', sourceId, by: `staff:${req.user.userId}`,
    }));
  }
  if (added.length) {
    const bookings = await col('bookings');
    await bookings.updateOne({ _id: booking._id }, { $set: { charges: [...(booking.charges || []), ...added], updatedAt: new Date() } });
    await audit('charges.fines_imported', { userId: req.user.userId }, { bookingId: booking._id, count: added.length });
  }
  await respond(res, booking._id, { imported: added.length, skipped, window: { from, to, plate: booking.handover.vehicle.plate } });
});

exports.waive = handle(async (req, res) => {
  const booking = await staffBooking(req);
  const note = cleanString(req.body?.note, 300);
  if (!note || note.length < 3) throw new HttpError(400, 'Give a reason for waiving it');
  const charge = (booking.charges || []).find((c) => c.id === req.params.chargeId);
  if (!charge) throw new HttpError(404, 'Charge not found');
  if (!['pending', 'billed'].includes(charge.status)) throw new HttpError(409, `This charge is already ${charge.status}.`);
  if (charge.status === 'billed' && booking.openSession?.n === charge.installment) {
    throw new HttpError(409, 'The client has a payment page open for this charge. Try again in an hour or once it expires.', 'SESSION_OPEN');
  }
  const r = extra.release(pay.scheduleOf(booking), booking.charges, [charge.id]);
  const charges = r.charges.map((c) => (c.id === charge.id ? { ...c, status: 'waived', waivedNote: note, waivedBy: req.user.userId, waivedAt: new Date() } : c));
  const bookings = await col('bookings');
  await bookings.updateOne({ _id: booking._id }, { $set: { installments: r.installments, charges, updatedAt: new Date() } });
  await audit('charge.waived', { userId: req.user.userId }, { bookingId: booking._id, chargeId: charge.id, note });
  await respond(res, booking._id);
});

/** Put pending charges on the next unpaid payment, or a new "Salik & fines" payment due today. */
exports.bill = handle(async (req, res) => {
  const booking = await staffBooking(req);
  if (!(booking.charges || []).some((c) => c.status === 'pending')) throw new HttpError(409, 'No pending charges.', 'NOTHING_PENDING');
  const next = pay.scheduleOf(booking).find((i) => i.status !== 'paid' && !i.upfront);
  if (next) await billing.attachCharges(booking._id, next.n);
  else await billing.billLeftoverCharges(booking._id, todayDubai());
  await audit('charges.billed_by_staff', { userId: req.user.userId }, { bookingId: booking._id });
  await respond(res, booking._id);
});

/** Open (pending or billed-but-unpaid) charges are released from payments and marked as covered by the deposit. */
function coverFromDeposit(booking, note) {
  const open = extra.open(booking.charges);
  if (!open.length) return null;
  const ids = open.map((c) => c.id);
  const r = extra.release(pay.scheduleOf(booking), booking.charges, ids);
  const charges = r.charges.map((c) => (ids.includes(c.id) ? { ...c, status: 'deposit', depositNote: note || 'Taken from the security deposit', installment: null } : c));
  return { installments: r.installments, charges, total: extra.sum(open), count: open.length, label: extra.extrasLabel(open) };
}

exports.coverFromDeposit = coverFromDeposit;
exports.CHARGEABLE = CHARGEABLE;
