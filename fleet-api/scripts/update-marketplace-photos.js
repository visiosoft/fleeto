/**
 * Points live listings at new van photos (files in assets/marketplace/vans, served from /api/marketplace/media/vans).
 * Only the first image is replaced; the cut-out for the studio background is found automatically
 * when assets/marketplace/vans/cutouts/<name>.png exists.
 *
 *   node scripts/update-marketplace-photos.js "12 Seater Van=hiace-12" "13 Seater Van=hiace-13"            (dry run)
 *   node scripts/update-marketplace-photos.js "12 Seater Van=hiace-12" "13 Seater Van=hiace-13" --confirm  (writes)
 *
 * Optional --company <companyId> limits it to one fleet company.
 * Writes to the database configured in config/db.js.
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const ci = args.indexOf('--company');
const companyId = ci >= 0 ? args[ci + 1] : undefined;
const pairs = args.filter((a, i) => a.includes('=') && args[i - 1] !== '--company').map((a) => {
  const [title, name] = a.split('=');
  return { title: title.trim(), name: name.trim() };
});

if (!pairs.length) {
  console.error('Usage: node scripts/update-marketplace-photos.js "<Listing title>=<photo name>" ... [--company <id>] [--confirm]');
  process.exit(1);
}

const VANS = path.join(__dirname, '../assets/marketplace/vans');

(async () => {
  const col = await db.getCollection('mp_listings');
  console.log(confirm ? 'Writing photo changes' : 'DRY RUN - nothing will be written');
  let planned = 0;
  for (const { title, name } of pairs) {
    if (!fs.existsSync(path.join(VANS, `${name}.jpg`))) {
      console.log(`  ! ${title}: assets/marketplace/vans/${name}.jpg not found, skipped`);
      continue;
    }
    const cutout = fs.existsSync(path.join(VANS, 'cutouts', `${name}.png`)) ? 'with cut-out' : 'no cut-out';
    const image = `/api/marketplace/media/vans/${name}.jpg`;
    const rows = await col.find({ title, ...(companyId ? { organizationId: companyId } : {}) }).toArray();
    if (!rows.length) console.log(`  - ${title}: no listing with that title`);
    for (const l of rows) {
      const current = (l.images || [])[0] || '(none)';
      if (current === image) { console.log(`  = ${title} [${l.supplierName || l.organizationId}]: already ${image}`); continue; }
      console.log(`  ~ ${title} [${l.supplierName || l.organizationId}]: ${current} -> ${image} (${cutout})`);
      planned += 1;
      if (confirm) {
        await col.updateOne({ _id: l._id }, { $set: { images: [image, ...(l.images || []).slice(1)], updatedAt: new Date() } });
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
