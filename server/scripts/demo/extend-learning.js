import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { demoConfig, connectDemo, manifestCollection, MANIFEST_ID, demoId, relativeDate } from './config.js';
import * as M from './models.js';
import LearningResource from '../../models/LearningResource.js';
import { createResource, updateResource } from '../../services/learningResources.js';
import { saveCommunication } from '../../services/communications.js';
export const EXTENSION_ID = 'demo-learning-v1';
export async function extendLearning() {
  const seed = await manifestCollection().findOne({ _id: MANIFEST_ID });
  if (seed?.state !== 'complete') throw new Error('A completed demo seed is required');
  const extension = await manifestCollection().findOne({ _id: EXTENSION_ID });
  if (extension?.state === 'complete') { console.log('Learning extension already complete. No resources, files or manual edits changed.'); return extension; }
  const resourceIds = Array.from({ length: 8 }, (_, n) => demoId(`learning/resource/${n}`));
  const noticeIds = Array.from({ length: 3 }, (_, n) => demoId(`learning/notice/${n}`));
  const calendarIds = Array.from({ length: 2 }, (_, n) => demoId(`learning/calendar/${n}`));
  if (!extension) {
    if (await LearningResource.exists({ _id: { $in: resourceIds } }) || await M.Notification.exists({ _id: { $in: noticeIds } }) || await M.AcademicCalendar.exists({ _id: { $in: calendarIds } })) throw new Error('Unmanaged fixture identifier collision');
    await manifestCollection().insertOne({ _id: EXTENSION_ID, state: 'building', resourceIds, noticeIds, calendarIds, createdAt: new Date() });
  }
  const admin = await M.User.findById(demoId('admin'));
  const assetRoot = fileURLToPath(new URL('../../../output/pdf/', import.meta.url));
  const before = `${relativeDate(seed.seedDate, -2)}T03:30:00Z`, future = `${relativeDate(seed.seedDate, 7)}T03:30:00Z`, expired = `${relativeDate(seed.seedDate, -1)}T03:30:00Z`;
  const scenarios = [
    ['Published English practice paper', 'Mock test', 0, 0, 0, 'published', before, null, 'demo-english-paper.pdf'],
    ['Draft English answer key (separate release)', 'Answer key', 0, 0, 0, 'draft', before, null, 'demo-english-answer-key.pdf'],
    ['Class 7 fractions study notes', 'Study material', 1, 2, 1, 'published', before, null, 'demo-fractions-study-notes.pdf'],
    ['Scheduled Class 6 B practice paper', 'Mock test', 0, 1, 0, 'published', future, null, 'demo-english-paper.pdf'],
    ['Expired English practice paper', 'Mock test', 0, 0, 0, 'published', before, expired, 'demo-english-paper.pdf'],
    ['Archived English practice paper', 'Mock test', 0, 0, 0, 'archived', before, null, 'demo-english-paper.pdf'],
    ['School-authorized fractions reference', 'Study material', 1, 3, 1, 'published', before, null, 'demo-fractions-study-notes.pdf'],
    ['Draft Class 6 B answer key', 'Answer key', 0, 1, 0, 'draft', before, null, 'demo-english-answer-key.pdf'],
  ];
  for (const [index, [title, type, cls, sec, sub, state, publishAt, expiresAt, filename]] of scenarios.entries()) {
    if (await LearningResource.exists({ _id: resourceIds[index] })) continue;
    const assignment = await M.TeacherAssignment.findById(demoId(`assignment/${sec}/${sub}`));
    const teacher = await M.Teacher.findById(assignment.teacher), uploader = index === 6 ? admin : await M.User.findById(teacher.user);
    const data = { title: `Demo: ${title}`, description: 'Original synthetic PDF for role, scheduling and download tests. No online exam or grading.', academicYear: String(demoId('year/current')), schoolClass: String(demoId(`class/${cls}`)), subject: String(demoId(`subject/${cls}/${sub}`)), sections: [String(demoId(`section/${sec}`))], type, state: state === 'archived' ? 'draft' : state, publishAt, expiresAt };
    const buffer = await fs.readFile(path.join(assetRoot, filename));
    const row = await createResource(uploader, data, { buffer, originalname: filename, mimetype: 'application/pdf' }, resourceIds[index]);
    if (state === 'archived') await updateResource(admin, row._id, { ...data, state: 'archived', reason: 'Synthetic archived example', version: row.__v });
  }
  for (const [index, audience] of ['Everyone', 'Teachers', 'Selected'].entries()) if (!await M.Notification.exists({ _id: noticeIds[index] })) await saveCommunication('notices', admin, null, { title: `Demo learning notice: ${audience}`, message: 'Original fictional school resource announcement. No email or SMS delivery.', type: 'Notice', priority: 'Low', publishDate: before, expiryDate: null, audience, targetClasses: [], targetSections: audience === 'Selected' ? [String(demoId('section/0'))] : [] }, noticeIds[index]);
  for (const [index, prior] of [false, true].entries()) if (!await M.AcademicCalendar.exists({ _id: calendarIds[index] })) await saveCommunication('calendar', admin, null, { academicYear: String(demoId(prior ? 'year/prior' : 'year/current')), title: prior ? 'Demo prior-year revision event' : 'Demo resource reading day', description: 'Informational only; does not modify attendance or timetable.', type: prior ? 'Event' : 'Working Day', startDate: prior ? '2026-03-20' : seed.seedDate, endDate: prior ? '2026-03-20' : seed.seedDate }, calendarIds[index]);
  await manifestCollection().updateOne({ _id: EXTENSION_ID }, { $set: { state: 'complete', completedAt: new Date() } });
  console.log('Added 8 private PDF resources, 3 targeted notices and 2 calendar entries. Existing records were preserved.');
  return manifestCollection().findOne({ _id: EXTENSION_ID });
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/extend-learning.js')) {
  try {
    process.env.RESOURCE_STORAGE_DIR ||= fileURLToPath(new URL('../../.demo-resource-files/', import.meta.url));
    await connectDemo(demoConfig()); await extendLearning();
  } catch { console.error('Demo learning extension failed. Check the dedicated database, original PDF assets and private storage. Reruns preserve completed records.'); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
}
