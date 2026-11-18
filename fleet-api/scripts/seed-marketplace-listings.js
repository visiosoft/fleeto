/**
 * Adds the starter listings (see services/marketplace/starterListings.js) for one fleet company:
 * 12/13/15/26 seater passenger vans (self-drive or with driver) and three cargo vans.
 *
 *   node scripts/seed-marketplace-listings.js --company <companyId> --supplier "Your Fleet LLC"           (dry run)
 *   node scripts/seed-marketplace-listings.js --company <companyId> --supplier "Your Fleet LLC" --confirm (writes)
 *
 * Listings whose title already exists for that company are skipped, so it is safe to re-run.
 * Writes to the database configured in config/db.js.
 */
const db = require('../config/db');
const { buildStarterListings } = require('../services/marketplace/starterListings');

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const companyId = arg('company');
const supplierName = arg('supplier') || 'Verified rental provider';
const city = arg('city') || 'Dubai';
const confirm = args.includes('--confirm');

if (!companyId) {
  console.error('Usage: node scripts/seed-marketplace-listings.js --company <companyId> [--supplier "Name"] [--city Dubai] [--confirm]');
  process.exit(1);
}

const fmt = (n) => `AED ${Number(n).toLocaleString('en-US')}`;

(async () => {
  const listings = buildStarterListings({ companyId, supplierName, city });
  const col = await db.getCollection('mp_listings');
  const existing = new Set((await col.find({ organizationId: companyId }).toArray()).map((l) => l.title));
  const toInsert = listings.filter((l) => !existing.has(l.title));

  console.log(`${confirm ? 'Writing' : 'DRY RUN - would write'} listings for company ${companyId} (${supplierName}, ${city})`);
  for (const l of listings) {
    const price = l.driverOption?.available
      ? `${fmt(l.rates.monthly)}/month self-drive, ${fmt(l.driverOption.rates.monthly)}/month with driver`
      : `${fmt(l.rates.monthly)}/month`;
    console.log(`  ${existing.has(l.title) ? 'skip (exists)' : 'add'}  ${l.title}: ${price}, deposit ${fmt(l.deposit)}`);
  }
  if (!confirm) {
    console.log('\nNothing written. Re-run with --confirm to insert.');
  } else if (toInsert.length) {
    const now = new Date();
    const result = await col.insertMany(toInsert.map((l) => ({ ...l, createdAt: now, updatedAt: now })));
    console.log(`Inserted ${result.insertedCount} listings.`);
  } else {
    console.log('Nothing to insert.');
  }
  await db.closeConnection();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
