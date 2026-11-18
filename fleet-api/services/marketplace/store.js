/**
 * Marketplace data access.
 * All marketplace collections are prefixed `mp_` so they never collide with
 * the fleet-management collections. `configure()` lets tests inject an
 * in-memory implementation instead of the live MongoDB.
 */
const db = require('../../config/db');

const COLLECTIONS = {
  customers: 'mp_customers',
  otps: 'mp_otp_codes',
  listings: 'mp_listings',
  bookings: 'mp_bookings',
  documents: 'mp_documents',
  fuelEntries: 'mp_fuel_entries',
  issues: 'mp_issue_reports',
  events: 'mp_audit_events',
  payments: 'mp_payments',
  stripeEvents: 'mp_stripe_events',
  notifications: 'mp_notifications',
  settings: 'mp_settings',
  coupons: 'mp_coupons',
};

let getCollectionImpl = (name) => db.getCollection(name);

function configure({ getCollection }) {
  if (getCollection) getCollectionImpl = getCollection;
}

function col(key) {
  const name = COLLECTIONS[key];
  if (!name) throw new Error(`Unknown marketplace collection: ${key}`);
  return getCollectionImpl(name);
}

/** Existing fleet-management collections (e.g. 'vehicles'), read-only use from the marketplace. */
function fleet(name) {
  return getCollectionImpl(name);
}

/** Append-only audit trail for status changes, documents, bookings. */
async function audit(type, actor, data = {}) {
  try {
    const events = await col('events');
    await events.insertOne({ type, actor, data, createdAt: new Date() });
  } catch (err) {
    console.error('[marketplace] audit write failed:', err.message);
  }
}

module.exports = { COLLECTIONS, configure, col, fleet, audit };
