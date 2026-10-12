import mongoose from 'mongoose';
import { demoConfig, connectDemo, manifestCollection, MANIFEST_ID, DB_NAME, safeError } from './config.js';
import { seedDemo } from './seed.js';
import { verifyDemo } from './verify.js';
import { writeDemoReport } from './report.js';
export function requireResetConfirmation(args) { if (!args.includes('--confirm-demo-reset')) throw safeError('Reset refused. Explicitly pass --confirm-demo-reset to delete only the selected school_erp_demo database, including its manual test changes.'); }
export async function resetDemo(args) {
  requireResetConfirmation(args);
  if (mongoose.connection.name !== DB_NAME || !await manifestCollection().findOne({ _id: MANIFEST_ID })) throw safeError('Reset requires the exact demo database and this tool’s seed manifest. Unmanaged data will not be deleted.');
  await mongoose.connection.db.dropDatabase();
}
async function main() {
  const command = process.argv[2];
  if (!['seed', 'verify', 'report', 'reset'].includes(command)) throw safeError('Use seed, verify, report or reset.');
  const config = demoConfig();
  if (command === 'reset') requireResetConfirmation(process.argv.slice(3));
  await connectDemo(config);
  if (command === 'reset') { await resetDemo(process.argv.slice(3)); console.log('Only school_erp_demo was reset. Run npm run seed:demo to recreate it.'); return; }
  if (command === 'seed') {
    const { manifest, created } = await seedDemo(config);
    if (!created) return;
    const result = await verifyDemo(config);
    await writeDemoReport(manifest, result);
    console.log(`Demo seeded and verified: ${manifest.counts.Student} students, ${manifest.counts.Teacher} teachers, ${manifest.counts.Timetable} bookings, ${manifest.counts.Attendance} attendance sessions. ${result.apiChecks} API checks passed. See DEMO_DATA_REPORT.md and DEMO_DATA_GUIDE.md.`);
  } else {
    const result = await verifyDemo(config);
    if (command === 'report') {
      await writeDemoReport(await manifestCollection().findOne({ _id: MANIFEST_ID }), result);
      console.log('Refreshed DEMO_DATA_REPORT.md and demo-data/catalog.json from verified demo data. No database records changed.');
    }
    console.log(`Demo verification passed: ${result.apiChecks} API checks, all reference/conflict/finance checks, repeated-seed preservation. No passwords, tokens or connection details logged.`);
  }
}
// Keep reset helpers importable by tests without executing a CLI command.
if (process.argv[1] && new URL(import.meta.url).pathname.endsWith('/cli.js') && process.argv[1].replaceAll('\\', '/').endsWith('/demo/cli.js')) {
  main().catch(error => { console.error(error.demoSafe || error.name === 'AssertionError' ? error.message : `Demo operation failed (${error.name || 'Error'}${error.code ? `, code ${error.code}` : ''}). Check the dedicated replica set; sensitive connection details are not logged. An incomplete seed requires an explicit demo reset.`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}
