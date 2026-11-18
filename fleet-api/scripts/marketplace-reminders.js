/**
 * Run VANLY payment reminders once (same logic as the daily job).
 *   node scripts/marketplace-reminders.js            (dry run: lists who would get a reminder)
 *   node scripts/marketplace-reminders.js --send     (sends and records them)
 */
const db = require('../config/db');
const { runPaymentReminders } = require('../services/marketplace/reminders');

(async () => {
  const send = process.argv.includes('--send');
  const results = await runPaymentReminders({ dryRun: !send });
  if (!results.length) console.log('No reminders due today.');
  results.forEach((r) => console.log(`${r.status.padEnd(10)} ${r.reference} month ${r.installment} (${r.kind === 'due' ? 'due today' : 'due in 3 days'})`));
  if (!send && results.length) console.log('\nDry run. Re-run with --send to send them.');
  await db.closeConnection();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
