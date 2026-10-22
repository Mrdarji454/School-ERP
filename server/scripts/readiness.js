// No dotenv loading, migrations, index creation, or database writes.
// Supply deployment variables through your secret manager / process environment.
import fs from 'node:fs/promises';
import { constants, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';

const root = fileURLToPath(new URL('../../', import.meta.url));
const local = process.argv.includes('--local');
let failures = 0;
async function check(label, fn) {
  try { await fn(); console.log(`PASS ${label}`); }
  catch { failures++; console.error(`FAIL ${label}`); }
}
const requireValue = value => { if (!value) throw new Error('Check failed'); };
await check('Node runtime is version 20 or newer', () => requireValue(Number(process.versions.node.split('.')[0]) >= 20));
await check('Built frontend entry exists', () => fs.access(path.join(root, 'client/dist/index.html')));
await check('Original school logo packaged with server', async () => {
  const bytes = await fs.readFile(path.join(root, 'server/assets/vedantLogo.png'));
  requireValue(createHash('sha256').update(bytes).digest('hex') === '97496557a5113f4b114c2fd36cd978c8236a00103da4daaa9abbe601fce89e6a');
});
await check('PDF renderer and pinned ReportLab runtime available', async () => {
  await fs.access(path.join(root, 'server/scripts/report-card-pdf.py'));
  const localPython = path.join(root, 'server/.reportcard-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const python = process.env.REPORTCARD_PYTHON || (existsSync(localPython) ? localPython : 'python');
  execFileSync(python, ['-c', 'import sys, reportlab; from PIL import Image; assert sys.version_info >= (3,10); assert reportlab.Version == "5.0.1"'], { windowsHide: true, timeout: 15000, stdio: 'pipe' });
  if (process.env.REPORTCARD_FONT_PATH) await fs.access(process.env.REPORTCARD_FONT_PATH);
});
if (!local) {
  await check('Production mode configured', () => requireValue(process.env.NODE_ENV === 'production'));
  await check('JWT secret configured with at least 32 characters', () => requireValue(process.env.JWT_SECRET?.length >= 32));
  await check('HTTPS frontend origin configured without URL path', () => {
    const origin = new URL(process.env.CLIENT_ORIGIN);
    requireValue(origin.protocol === 'https:' && origin.origin === process.env.CLIENT_ORIGIN && !origin.username && !origin.password);
  });
  await check('Explicit school timezone is valid', () => {
    requireValue(process.env.SCHOOL_TIMEZONE);
    new Intl.DateTimeFormat('en', { timeZone: process.env.SCHOOL_TIMEZONE }).format();
  });
  await check('Existing private storage is writable and outside served project directories', async () => {
    const configured = process.env.RESOURCE_STORAGE_DIR;
    requireValue(configured && path.isAbsolute(configured));
    const real = await fs.realpath(configured);
    for (const publicDir of ['client', 'public', 'server/public']) {
      const relative = path.relative(path.join(root, publicDir), real);
      requireValue(relative.startsWith('..') || path.isAbsolute(relative));
    }
    await fs.access(real, constants.R_OK | constants.W_OK);
  });
  await check('PDF upload limit is valid', () => {
    const limit = Number(process.env.RESOURCE_MAX_MB || 10);
    requireValue(Number.isFinite(limit) && limit > 0 && limit <= 100);
  });
  await check('Database URI explicitly configured', () => requireValue(process.env.MONGO_URI));
}
if (process.argv.includes('--database')) {
  await check('Database is a writable replica primary with report-card uniqueness indexes', async () => {
    requireValue(process.env.MONGO_URI);
    const client = new mongoose.mongo.MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, socketTimeoutMS: 5000 });
    try {
      await client.connect();
      const hello = await client.db('admin').command({ hello: 1 });
      requireValue(hello.setName && hello.isWritablePrimary);
      const indexes = await client.db().collection('reportcards').indexes();
      for (const key of [{ publication: 1, candidate: 1 }, { exam: 1, candidate: 1, issueNumber: 1 }]) {
        requireValue(indexes.some(index => index.unique && !index.sparse && !index.partialFilterExpression && JSON.stringify(index.key) === JSON.stringify(key)));
      }
    } finally { await client.close(); }
  });
} else console.log('SKIP database inspection (use --database with an explicitly supplied isolated or approved deployment URI)');
console.log(local ? 'Local packaging check only; production readiness is not certified.' : 'Infrastructure, TLS, backups, monitoring and browser acceptance require the operations checklist.');
process.exitCode = failures ? 1 : 0;
