import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import LearningResource from '../models/LearningResource.js';
import Attendance from '../models/Attendance.js';
import Timetable from '../models/TimeTable.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import { storageRoot, privatePath } from '../services/privateStorage.js';
import { cleanupResources } from '../services/resourceCleanup.js';

export function syntheticPdf() {
  const stream = 'BT /F1 16 Tf 50 750 Td (Original synthetic practice question: What is 2 plus 3?) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let content = '%PDF-1.4\n', offsets = [0];
  for (let i = 0; i < objects.length; i++) { offsets.push(Buffer.byteLength(content)); content += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = Buffer.byteLength(content); content += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(content);
}
export async function verifyLearning({ request, token, directory }) {
  process.env.RESOURCE_STORAGE_DIR = path.join(directory, 'private-pdf-tests');
  const root = await storageRoot(), password = 'LearningInitial123!';
  const year = await request('POST', '/academic-years', { name: 'Resource academic year', startDate: '2026-04-01', endDate: '2027-03-31' }, token);
  const cls = await request('POST', '/classes', { name: 'Resource class', academicYear: year._id }, token);
  const sections = [];
  for (const name of ['A', 'B', 'C']) sections.push(await request('POST', '/sections', { name, schoolClass: cls._id }, token, 201));
  const subject = await request('POST', '/subjects', { name: 'English', code: 'RES-ENG', schoolClass: cls._id }, token, 201);
  const teachers = [], teacherTokens = [];
  for (let i = 0; i < 2; i++) {
    teachers.push(await request('POST', '/teachers', { fullname: `Resource teacher ${i}`, email: `resource-teacher${i}@example.test`, password, qualification: 'B.Ed', designation: 'Teacher', joiningDate: '2026-04-01' }, token, 201));
    const initial = await request('POST', '/auth/login', { email: `resource-teacher${i}@example.test`, password });
    await request('GET', '/resources', null, initial.token, 403);
    teacherTokens.push((await request('POST', '/auth/password', { currentPassword: password, newPassword: 'LearningChanged123!' }, initial.token)).token);
  }
  const assignments = [];
  for (let i = 0; i < 3; i++) assignments.push(await request('POST', '/teacher-assignments', { academicYear: year._id, schoolClass: cls._id, section: sections[i]._id, subject: subject._id, teacher: teachers[i === 2 ? 1 : 0]._id }, token, 201));
  const studentTokens = [];
  for (let i = 0; i < 2; i++) {
    await request('POST', '/students', { fullname: `Resource student ${i}`, email: `resource-student${i}@example.test`, password, schoolClass: cls._id, section: sections[i === 0 ? 0 : 2]._id, rollNumber: 1, gender: 'Other', dob: '2015-01-01' }, token, 201);
    const initial = await request('POST', '/auth/login', { email: `resource-student${i}@example.test`, password });
    studentTokens.push((await request('POST', '/auth/password', { currentPassword: password, newPassword: 'LearningChanged123!' }, initial.token)).token);
  }
  const pdf = syntheticPdf(), before = new Date(Date.now() - 3600000).toISOString(), future = new Date(Date.now() + 86400000).toISOString();
  const base = { title: 'Original resource practice paper', description: 'Synthetic document', type: 'Mock test', academicYear: year._id, schoolClass: cls._id, subject: subject._id, sections: sections.slice(0, 2).map(s => s._id), state: 'published', publishAt: before, expiresAt: null };
  const form = (data = base, buffer = pdf, filename = 'original.pdf', mime = 'application/pdf') => { const f = new FormData(); f.append('metadata', JSON.stringify(data)); f.append('file', new Blob([buffer], { type: mime }), filename); return f; };
  await request('POST', '/resources', form(), null, 401);
  await request('POST', '/resources', form(), studentTokens[0], 403);
  await request('POST', '/resources', form({ ...base, sections: [sections[2]._id] }), teacherTokens[0], 403);
  const beforeFiles = await fs.readdir(root);
  for (const [buffer, name, mime] of [[Buffer.from('not a PDF'), 'fake.pdf', 'application/pdf'], [pdf, '../escape.pdf', 'application/pdf'], [pdf, 'wrong.txt', 'application/pdf'], [pdf, 'wrong.pdf', 'text/plain']]) await request('POST', '/resources', form(base, buffer, name, mime), teacherTokens[0], 400);
  process.env.RESOURCE_MAX_MB = '0.001'; await request('POST', '/resources', form(base, Buffer.alloc(2048)), teacherTokens[0], 400); delete process.env.RESOURCE_MAX_MB;
  await request('POST', '/resources', form({ ...base, title: '', storageKey: '../forged' }), teacherTokens[0], 400);
  assert.deepEqual(await fs.readdir(root), beforeFiles);
  const originalCreate = LearningResource.create;
  try { LearningResource.create = async () => { throw new Error('Simulated database failure'); }; await request('POST', '/resources', form(), teacherTokens[0], 500); }
  finally { LearningResource.create = originalCreate; }
  assert.deepEqual(await fs.readdir(root), beforeFiles, 'Metadata failure must remove stored bytes');
  const blockedRoot = path.join(directory, 'storage-is-a-file');
  await fs.writeFile(blockedRoot, 'Synthetic storage failure fixture');
  const beforeStorageFailure = await LearningResource.countDocuments();
  try { process.env.RESOURCE_STORAGE_DIR = blockedRoot; await request('POST', '/resources', form(), teacherTokens[0], 500); }
  finally { process.env.RESOURCE_STORAGE_DIR = root; }
  assert.equal(await LearningResource.countDocuments(), beforeStorageFailure, 'Storage failure must not create metadata');
  assert.deepEqual(await fs.readdir(root), beforeFiles, 'Storage failure must not leave uploaded files');
  const paper = await request('POST', '/resources', form(), teacherTokens[0]);
  assert.equal(paper.file.key, undefined); assert.equal(paper.uploader.email, undefined);
  const edit = (row, changes = {}) => ({ ...base, title: row.title, type: row.type, state: row.state, publishAt: row.publishAt, expiresAt: row.expiresAt, version: row.__v, ...changes });
  await request('PUT', `/resources/${paper._id}`, edit(paper), teacherTokens[1], 404);
  const visible = await request('GET', '/resources', null, studentTokens[0]); assert.ok(visible.records.some(r => r._id === paper._id)); assert.ok(visible.records.every(r => !r.audit && !r.file.key && !r.uploader.email));
  const bytes = await request('GET', `/resources/${paper._id}/file`, null, studentTokens[0]); assert.deepEqual(bytes, pdf);
  await request('GET', `/resources/${paper._id}/file?inline=true`, null, studentTokens[0]);
  await request('GET', `/resources/${paper._id}`, null, studentTokens[1], 404);
  await request('GET', `/resources/${paper._id}/file`, null, studentTokens[1], 404);
  await request('GET', `/resources/${paper._id}/file`, null, null, 401);
  const hidden = [];
  for (const changes of [{ state: 'draft', type: 'Answer key' }, { publishAt: future }, { publishAt: new Date(Date.now() - 7200000).toISOString(), expiresAt: before }]) {
    const row = await request('POST', '/resources', form({ ...base, ...changes }), teacherTokens[0]); hidden.push(row);
    await request('GET', `/resources/${row._id}/file`, null, studentTokens[0], 404);
    await request('GET', `/resources/${row._id}`, null, studentTokens[0], 404);
  }
  const key = await request('PUT', `/resources/${hidden[0]._id}`, edit(hidden[0], { state: 'published' }), teacherTokens[0]);
  await request('GET', `/resources/${key._id}/file`, null, studentTokens[0]);
  await request('PUT', `/resources/${key._id}`, edit(hidden[0], { state: 'published' }), teacherTokens[0], 409);
  await request('PUT', `/resources/${paper._id}`, edit(paper, { state: 'archived' }), token, 400);
  const archived = await request('PUT', `/resources/${paper._id}`, edit(paper, { state: 'archived', reason: 'Synthetic retirement' }), token);
  await request('GET', `/resources/${paper._id}/file`, null, studentTokens[0], 404);
  await request('GET', `/resources/${paper._id}/file`, null, teacherTokens[0], 404);
  await request('GET', `/resources/${paper._id}/file`, null, token);
  await request('PUT', `/resources/${paper._id}`, edit(archived, { state: 'published' }), token, 400);
  await request('PUT', `/resources/${paper._id}`, edit(archived, { state: 'draft' }), teacherTokens[0], 403);
  const notice = { title: 'Targeted resource notice', message: 'Synthetic notice', type: 'Notice', priority: 'Low', publishDate: before, expiryDate: null, audience: 'Selected', targetClasses: [], targetSections: [sections[0]._id] };
  const selected = await request('POST', '/notifications', notice, token, 201);
  const teachersNotice = await request('POST', '/communications/notices', { ...notice, title: 'Teachers only', audience: 'Teachers', targetSections: [] }, token);
  const studentsNotice = await request('POST', '/communications/notices', { ...notice, title: 'Students only', audience: 'Students', targetSections: [] }, token);
  const futureNotice = await request('POST', '/notifications', { ...notice, title: 'Future selected notice', publishDate: future }, token, 201);
  for (const endpoint of ['/workflow/notices', '/notifications/active', '/communications/notices']) {
    const own = await request('GET', endpoint, null, studentTokens[0]); const rows = own.records || own; assert.ok(rows.some(r => r._id === selected._id)); assert.ok(rows.some(r => r._id === studentsNotice._id)); assert.ok(rows.every(r => r._id !== teachersNotice._id && r._id !== futureNotice._id));
    const other = await request('GET', endpoint, null, studentTokens[1]); assert.ok((other.records || other).every(r => r._id !== selected._id));
    const teacher = await request('GET', endpoint, null, teacherTokens[0]); assert.ok((teacher.records || teacher).some(r => r._id === selected._id)); assert.ok((teacher.records || teacher).every(r => r._id !== studentsNotice._id));
  }
  await request('GET', `/notifications/${teachersNotice._id}`, null, studentTokens[0], 404);
  await request('GET', `/notifications/${selected._id}`, null, studentTokens[1], 404);
  await request('DELETE', `/notifications/${selected._id}`, null, token);
  await request('GET', `/communications/notices/${selected._id}`, null, studentTokens[0], 404);
  await request('PATCH', `/notifications/${selected._id}/restore`, {}, token);
  await request('GET', `/communications/notices/${selected._id}`, null, studentTokens[0]);
  await request('POST', '/notifications', { ...notice, expiryDate: before }, token, 400);
  await request('POST', '/communications/notices', { ...notice, role: 'Admin' }, token, 400);
  const attendanceCount = await Attendance.countDocuments(), timetableCount = await Timetable.countDocuments();
  const calendar = await request('POST', '/academic-calendar', { academicYear: year._id, title: 'Synthetic holiday', type: 'Holiday', startDate: '2026-10-15', endDate: '2026-10-15' }, token, 201);
  await request('GET', `/academic-calendar/${calendar._id}`, null, studentTokens[0]);
  const unrelatedYear = await request('POST', '/academic-years', { name: 'Unrelated resource year', startDate: '2030-04-01', endDate: '2031-03-31' }, token);
  const otherEvent = await request('POST', '/academic-calendar', { academicYear: unrelatedYear._id, title: 'Unrelated event', type: 'Exam', startDate: '2030-10-15', endDate: '2030-10-15' }, token, 201);
  await request('GET', `/academic-calendar/${otherEvent._id}`, null, studentTokens[0], 404);
  const calendars = await request('GET', '/academic-calendar', null, studentTokens[0]); assert.ok(calendars.every(r => r._id !== otherEvent._id && !r.createdBy));
  await request('DELETE', `/academic-calendar/${calendar._id}`, null, token);
  await request('GET', `/academic-calendar/${calendar._id}`, null, studentTokens[0], 404);
  await request('PATCH', `/academic-calendar/${calendar._id}/restore`, {}, token);
  await request('POST', '/communications/calendar', { academicYear: year._id, title: 'Invalid day', type: 'Holiday', startDate: '2026-02-30', endDate: '2026-03-01' }, token, 400);
  assert.equal(await Attendance.countDocuments(), attendanceCount); assert.equal(await Timetable.countDocuments(), timetableCount);
  await TeacherAssignment.updateMany({ _id: { $in: assignments.slice(0, 2).map(a => a._id) } }, { $set: { isActive: false } });
  await request('PUT', `/resources/${key._id}`, edit(key), teacherTokens[0], 404);
  await request('GET', `/resources/${key._id}/file`, null, teacherTokens[0], 404);
  await request('GET', `/notifications/${selected._id}`, null, teacherTokens[0], 404);
  await assert.rejects(privatePath('../traversal.pdf'), /Invalid file key/);
  const stored = await LearningResource.findById(paper._id), orphan = `${randomUUID()}.pdf`, recent = `${randomUUID()}.pdf`, old = new Date(Date.now() - 48 * 3600000);
  await fs.writeFile(path.join(root, orphan), pdf); await fs.utimes(path.join(root, orphan), old, old); await fs.writeFile(path.join(root, recent), pdf); await fs.utimes(await privatePath(stored.file.key), old, old);
  const dry = await cleanupResources(); assert.ok(dry.candidates.includes(orphan)); assert.equal(dry.removed.length, 0); assert.ok(!dry.candidates.includes(stored.file.key));
  const cleaned = await cleanupResources({ remove: true }); assert.ok(cleaned.removed.includes(orphan)); assert.ok(!cleaned.removed.includes(recent)); assert.ok(await fs.stat(await privatePath(stored.file.key)));
}
