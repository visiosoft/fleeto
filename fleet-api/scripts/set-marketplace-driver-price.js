/**
 * Turns on (or changes) the with-driver monthly price for live listings.
 *
 *   node scripts/set-marketplace-driver-price.js "7 Seater Van=3500"            (dry run)
 *   node scripts/set-marketplace-driver-price.js "7 Seater Van=3500" --confirm  (writes)
 *   node scripts/set-marketplace-driver-price.js "7 Seater Van=0" --confirm     (turns the driver option off)
 *
 * Self-drive prices are not touched. Existing bookings keep the price they were quoted.
 * Optional --company <companyId> limits it to one fleet company. Writes to the database in config/db.js.
 */
const db = require('../config/db');

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const ci = args.indexOf('--company');
const companyId = ci >= 0 ? args[ci + 1] : undefined;
const pairs = args.filter((a, i) => a.includes('=') && args[i - 1] !== '--company').map((a) => {
  const [title, amount] = a.split('=');
  return { title: title.trim(), amount: Number(amount) };
});
if (!pairs.length || pairs.some((p) => !Number.isFinite(p.amount) || p.amount < 0)) {
  console.error('Usage: node scripts/set-marketplace-driver-price.js "<Listing title>=<AED per month, 0 = off>" ... [--company <id>] [--confirm]');
  process.exit(1);
}
const fmt = (n) => `AED ${Number(n).toLocaleString('en-US')}`;

(async () => {
  const col = await db.getCollection('mp_listings');
  console.log(confirm ? 'Writing driver prices' : 'DRY RUN - nothing will be written');
  let planned = 0;
  for (const { title, amount } of pairs) {
    const rows = await col.find({ title, ...(companyId ? { organizationId: companyId } : {}) }).toArray();
    if (!rows.length) console.log(`  - ${title}: no listing with that title`);
    for (const l of rows) {
      const cur = l.driverOption?.available ? fmt(l.driverOption.rates?.monthly) : 'no driver option';
      const next = amount > 0 ? fmt(amount) : 'no driver option';
      if (cur === next) { console.log(`  = ${title} [${l.supplierName || l.organizationId}]: already ${cur}`); continue; }
      const seats = l.specs?.seats;
      console.log(`  ~ ${title} [${l.supplierName || l.organizationId}]: with driver ${cur} -> ${next} (self-drive stays ${fmt(l.rates?.monthly)})`);
      planned += 1;
      if (confirm) {
        await col.updateOne({ _id: l._id }, {
          $set: {
            driverOption: amount > 0 ? { available: true, rates: { monthly: amount } } : { available: false, rates: {} },
            ...(l.category === 'passenger' && seats ? { tagline: amount > 0 ? `${seats} passengers · Self-drive or with driver` : `${seats} passengers · Self-drive` } : {}),
            updatedAt: new Date(),
          },
        });
      }
    }
  }
  console.log(confirm ? `\nUpdated ${planned} listing(s).` : `\n${planned} listing(s) would change. Re-run with --confirm to write.`);
  await db.closeConnection();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
