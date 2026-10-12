import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { demoConfig, connectDemo, manifestCollection, demoId } from './config.js';
import { EXTENSION_ID, extendLearning } from './extend-learning.js';
import { fingerprint } from './verify.js';
import { startDemoApi } from './api.js';
import LearningResource from '../../models/LearningResource.js';
import { privatePath, storageRoot } from '../../services/privateStorage.js';
export async function verifyLearningDemo(config) {
  const extension = await manifestCollection().findOne({ _id: EXTENSION_ID, state: 'complete' });
  assert.ok(extension, 'Run the explicit learning extension first');
  const rows = await LearningResource.find({ _id: { $in: extension.resourceIds } }).lean();
  assert.equal(rows.length, 8);
  for (const row of rows) {
    const bytes = await fs.readFile(await privatePath(row.file.key));
    assert.equal(bytes.length, row.file.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), row.file.sha256);
    assert.match(bytes.subarray(0, 8).toString(), /^%PDF-/);
  }
  const api = await startDemoApi();
  let apiChecks;
  try {
    const tokens = {};
    for (const role of ['admin', 'teacher1', 'teacher2', 'student1', 'student2']) tokens[role] = (await api.request('POST', '/auth/login', { email: `${role}@demo.example.test`, password: config.password })).token;
    const admin = await api.request('GET', '/resources?limit=100', null, tokens.admin);
    assert.ok(extension.resourceIds.every(id => admin.records.some(r => String(r._id) === String(id))));
    assert.ok(admin.records.every(r => !r.file.key && !r.file.sha256));
    const first = await api.request('GET', '/resources?limit=100', null, tokens.student1);
    assert.ok(first.records.every(r => r.state === 'published' && r.sections.some(s => String(s._id) === String(demoId('section/0'))) && !r.audit && !r.file.key));
    for (const index of [1, 2, 5, 6, 7]) await api.request('GET', `/resources/${extension.resourceIds[index]}`, null, tokens.student1, 404);
    await api.request('GET', `/resources/${extension.resourceIds[0]}`, null, tokens.teacher2, 404);
    const notices = await api.request('GET', '/workflow/notices', null, tokens.student1);
    assert.ok(!notices.some(n => String(n._id) === String(extension.noticeIds[1])));
    const calendar = await api.request('GET', '/communications/calendar', null, tokens.student1);
    assert.ok(!calendar.records.some(e => String(e._id) === String(extension.calendarIds[1])));
    apiChecks = api.checks;
  } finally { await api.close(); }
  const before = await fingerprint(), filesBefore = (await fs.readdir(await storageRoot())).sort();
  await extendLearning();
  assert.equal(await fingerprint(), before, 'Repeated extension preserves all records and manual edits');
  assert.deepEqual((await fs.readdir(await storageRoot())).sort(), filesBefore, 'Repeated extension does not duplicate files');
  return { resources: rows.length, noticesAdded: extension.noticeIds.length, calendarEntriesAdded: extension.calendarIds.length, apiChecks, repeatedExtensionPreservesData: true };
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/verify-learning.js')) {
  try {
    process.env.RESOURCE_STORAGE_DIR ||= fileURLToPath(new URL('../../.demo-resource-files/', import.meta.url));
    const config = demoConfig(); await connectDemo(config);
    console.log(JSON.stringify(await verifyLearningDemo(config), null, 2));
  } catch (error) { console.error(`Demo learning verification failed: ${error.code || error.name}. Manual changes may explain fixture differences.`); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
}
