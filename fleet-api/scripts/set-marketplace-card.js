/**
 * Points live listings at a finished card image (assets/marketplace/cards, served from /api/marketplace/media/cards)
 * that the app shows as-is in the van list.
 *
 *   node scripts/set-marketplace-card.js "26 Seater Minibus=minibus-26-card.webp"            (dry run)
 *   node scripts/set-marketplace-card.js "26 Seater Minibus=minibus-26-card.webp" --confirm  (writes)
 *   node scripts/set-marketplace-card.js "26 Seater Minibus=" --confirm                       (removes the card image)
 *
 * Optional --company <companyId> limits it to one fleet company. Writes to the database in config/db.js.
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const ci = args.indexOf('--company');
const companyId = ci >= 0 ? args[ci + 1] : undefined;
const pairs = args.filter((a, i) => a.includes('=') && args[i - 1] !== '--company').map((a) => {
  const [title, file] = a.split('=');
  return { title: title.trim(), file: (file || '').trim() };
});
if (!pairs.length) {
  console.error('Usage: node scripts/set-marketplace-card.js "<Listing title>=<file in assets/marketplace/cards>" ... [--company <id>] [--confirm]');
  process.exit(1);
}
const CARDS = path.join(__dirname, '../assets/marketplace/cards');

(async () => {
  const col = await db.getCollection('mp_listings');
  console.log(confirm ? 'Writing card images' : 'DRY RUN - nothing will be written');
  let planned = 0;
  for (const { title, file } of pairs) {
    if (file && !fs.existsSync(path.join(CARDS, file))) { console.log(`  ! ${title}: assets/marketplace/cards/${file} not found, skipped`); continue; }
    const value = file ? `/api/marketplace/media/cards/${file}` : null;
    const rows = await col.find({ title, ...(companyId ? { organizationId: companyId } : {}) }).toArray();
    if (!rows.length) console.log(`  - ${title}: no listing with that title`);
    for (const l of rows) {
      const current = l.cardImage || '(none)';
      if ((l.cardImage || null) === value) { console.log(`  = ${title} [${l.supplierName || l.organizationId}]: already ${current}`); continue; }
      console.log(`  ~ ${title} [${l.supplierName || l.organizationId}]: ${current} -> ${value || '(none)'}`);
      planned += 1;
      if (confirm) await col.updateOne({ _id: l._id }, { $set: { cardImage: value, updatedAt: new Date() } });
    }
  }
  console.log(confirm ? `\nUpdated ${planned} listing(s).` : `\n${planned} listing(s) would change. Re-run with --confirm to write.`);
  await db.closeConnection();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
