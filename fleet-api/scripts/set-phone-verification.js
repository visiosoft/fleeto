/**
 * Turns marketplace phone verification (login SMS codes) on or off in the database, no restart needed
 * (the API re-reads it within 30 seconds). Off if EITHER this or MARKETPLACE_PHONE_VERIFICATION=off in .env says so.
 * While off, anyone can sign in as any phone number - testing / SMS outages only.
 *
 *   node scripts/set-phone-verification.js off            (dry run)
 *   node scripts/set-phone-verification.js off --confirm  (writes)
 *   node scripts/set-phone-verification.js on --confirm   (back on)
 *
 * Writes to the database configured in config/db.js.
 */
const db = require('../config/db');

const args = process.argv.slice(2);
const value = (args.find((a) => a === 'on' || a === 'off') || '').toLowerCase();
const confirm = args.includes('--confirm');
if (!value) {
  console.error('Usage: node scripts/set-phone-verification.js on|off [--confirm]');
  process.exit(1);
}

(async () => {
  const col = await db.getCollection('mp_config');
  const doc = await col.findOne({ key: 'auth' });
  const current = doc?.phoneVerification || 'on (not set)';
  console.log(`${confirm ? 'Writing' : 'DRY RUN - nothing will be written'}: phone verification ${current} -> ${value}`);
  if (value === 'off') console.log('  While off, anyone can sign in as any phone number.');
  if (confirm) {
    await col.updateOne({ key: 'auth' }, { $set: { key: 'auth', phoneVerification: value, updatedAt: new Date() } }, { upsert: true });
    console.log('Saved. The API picks it up within 30 seconds.');
  } else {
    console.log('Re-run with --confirm to save.');
  }
  await db.closeConnection();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
