/**
 * Public van listings, availability and server-side quotes.
 * Browsing needs no account.
 */
const { col } = require('../../services/marketplace/store');
const { parseDay } = require('../../services/marketplace/pricing');
const { quoteFor } = require('../../services/marketplace/quoteService');
const settingsSvc = require('../../services/marketplace/settings');
const { toId, HttpError, handle } = require('../../services/marketplace/util');

// Bookings in these states hold the van's dates.
const BLOCKING_STATUSES = [
  'pending_verification', 'approved', 'contract_pending', 'payment_pending',
  'confirmed', 'handover_pending', 'active', 'overdue', 'return_pending',
];
const CATEGORIES = ['small', 'medium', 'large', 'passenger'];

// Transparent cut-outs of the starter van photos (assets/marketplace/vans/cutouts), drawn on the app's studio backdrop.
const fs = require('fs');
const path = require('path');
const CUTOUT_DIR = path.join(__dirname, '../../assets/marketplace/vans/cutouts');
const cutoutCache = new Map();
function cutoutFor(l) {
  if (l.cutoutImage) return l.cutoutImage;
  if (l.cutoutImage === null) return null; // staff uploaded a normal photo: show it as-is
  const m = /\/api\/marketplace\/media\/vans\/([\w-]+)\.jpg$/.exec((l.images || [])[0] || '');
  if (!m) return null;
  if (!cutoutCache.has(m[1])) cutoutCache.set(m[1], fs.existsSync(path.join(CUTOUT_DIR, `${m[1]}.png`)));
  return cutoutCache.get(m[1]) ? `/api/marketplace/media/vans/cutouts/${m[1]}.png` : null;
}

function publicListing(l) {
  return {
    id: l._id.toString(),
    title: l.title,
    category: l.category,
    tagline: l.tagline || '',
    description: l.description || '',
    city: l.city,
    pickupBranch: l.pickupBranch || '',
    images: Array.isArray(l.images) ? l.images : [],
    specs: {
      make: l.specs?.make || '',
      model: l.specs?.model || '',
      year: l.specs?.year || null,
      transmission: l.specs?.transmission || '',
      fuelType: l.specs?.fuelType || '',
      seats: l.specs?.seats || null,
      payloadKg: l.specs?.payloadKg || null,
      cargoVolumeM3: l.specs?.cargoVolumeM3 || null,
      roof: l.specs?.roof || '',
    },
    rates: l.rates,
    driverOption: l.driverOption?.available ? { available: true, rates: l.driverOption.rates || {} } : { available: false, rates: {} },
    deposit: l.deposit,
    deliveryAvailable: !!l.deliveryAvailable,
    deliveryFee: l.deliveryAvailable ? l.deliveryFee || 0 : null,
    mileageAllowance: l.mileageAllowance || {},
    excessKmRate: l.excessKmRate ?? null,
    policies: l.policies || {},
    supplier: { name: l.supplierName || 'Verified rental provider' },
    featured: !!l.featured,
    orSimilar: l.orSimilar !== false,
    bannerImage: l.bannerImage || null,
    cardImage: l.cardImage || null,
    cutoutImage: cutoutFor(l),
  };
}

/** Add the company's protection plans and duration packages (one settings lookup per company). */
async function withOffers(rows) {
  const cache = {};
  const out = [];
  for (const l of rows) {
    const org = String(l.organizationId || '');
    if (!cache[org]) cache[org] = await settingsSvc.getSettings(org);
    const s = cache[org];
    const monthly = (l.rates?.monthly || 0) > 0;
    out.push({
      ...publicListing(l),
      includedCover: s.includedCover,
      protectionPlans: monthly ? settingsSvc.publicPlans(s) : [],
      durations: monthly
        ? s.durations.map((d) => ({ months: d.months, label: d.label, discountPct: d.discountPct, monthlyRate: Math.round(l.rates.monthly * (1 - d.discountPct / 100) * 100) / 100 }))
        : [],
    });
  }
  return out;
}

async function findActiveListing(id) {
  const _id = toId(id);
  if (!_id) throw new HttpError(404, 'Van not found');
  const listings = await col('listings');
  const listing = await listings.findOne({ _id, status: 'active' });
  if (!listing) throw new HttpError(404, 'Van not found');
  return listing;
}

/** Bookings overlapping [startDate, endDate). Dates are YYYY-MM-DD strings. */
async function overlapping(listingId, startDate, endDate, excludeId) {
  const bookings = await col('bookings');
  const rows = await bookings
    .find({
      listingId: listingId.toString(),
      status: { $in: BLOCKING_STATUSES },
      'quote.startDate': { $lt: endDate },
      'quote.endDate': { $gt: startDate },
    })
    .toArray();
  return excludeId ? rows.filter((b) => b._id.toString() !== excludeId.toString()) : rows;
}

exports.list = handle(async (req, res) => {
  const query = { status: 'active' };
  if (typeof req.query.city === 'string' && req.query.city) query.city = req.query.city;
  if (CATEGORIES.includes(req.query.category)) query.category = req.query.category;
  const listings = await col('listings');
  const rows = await listings.find(query).sort({ sortOrder: 1, createdAt: -1 }).limit(100).toArray();
  res.json({ status: 'success', data: { listings: await withOffers(rows) } });
});

exports.get = handle(async (req, res) => {
  const listing = await findActiveListing(req.params.id);
  res.json({ status: 'success', data: { listing: (await withOffers([listing]))[0] } });
});

/** Busy date ranges for the calendar. Never exposes who booked. */
exports.availability = handle(async (req, res) => {
  const listing = await findActiveListing(req.params.id);
  const from = parseDay(req.query.from) ? req.query.from : new Date().toISOString().slice(0, 10);
  const toDefault = new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10);
  const to = parseDay(req.query.to) ? req.query.to : toDefault;
  const rows = await overlapping(listing._id, from, to);
  res.json({
    status: 'success',
    data: { busy: rows.map((b) => ({ startDate: b.quote.startDate, endDate: b.quote.endDate })) },
  });
});

exports.quote = handle(async (req, res) => {
  const body = req.body || {};
  const listing = await findActiveListing(body.listingId);
  const { error, quote, couponError } = await quoteFor(listing, body);
  if (error) throw new HttpError(400, error, 'INVALID_QUOTE');
  const clashes = await overlapping(listing._id, quote.startDate, quote.endDate);
  res.json({ status: 'success', data: { quote, available: clashes.length === 0, couponError: couponError || null } });
});

exports.BLOCKING_STATUSES = BLOCKING_STATUSES;
exports.CATEGORIES = CATEGORIES;
exports.publicListing = publicListing;
exports.findActiveListing = findActiveListing;
exports.overlapping = overlapping;
