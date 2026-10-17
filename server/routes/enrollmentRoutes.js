import express from 'express';
import asyncHandler from 'express-async-handler';
import ExcelJS from 'exceljs';
import { protect } from '../middleware/authMIddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import Student from '../models/Student.js';
import { enrollmentList, enrollmentTimeline, previewTransition, commitTransition } from '../services/enrollments.js';
import { initializationPlan } from '../services/enrollmentInitialization.js';
import { onlyFields } from '../services/profileValidation.js';
import { fail } from '../utils/errors.js';
const router = express.Router();
router.use(protect);
const reply = fn => asyncHandler(async (req, res) => res.json({ success: true, data: await fn(req) }));
router.get('/mine', authorize('Student'), reply(async req => { const s = await Student.findOne({ user: req.user._id }); if (!s) fail(404, 'Student not found'); return enrollmentTimeline(s._id, false); }));
router.use(authorize('Admin'));
router.get('/', reply(req => enrollmentList(req.query)));
router.get('/readiness', reply(req => initializationPlan(req.query.cutover)));
router.get('/student/:id', reply(req => enrollmentTimeline(req.params.id)));
router.post('/preview', reply(req => previewTransition(req.user, req.body)));
router.post('/commit', reply(req => { onlyFields(req.body, ['previewToken']); return commitTransition(req.user, req.body.previewToken); }));
router.post('/bulk-preview', reply(async req => {
  onlyFields(req.body, ['rows']);
  if (!Array.isArray(req.body.rows) || !req.body.rows.length || req.body.rows.length > 100) fail(400, 'Choose 1-100 students per batch');
  if (new Set(req.body.rows.map(r => r.student)).size !== req.body.rows.length) fail(400, 'Each student may appear only once in a batch');
  const outcomes = [], slots = new Set();
  for (const row of req.body.rows) {
    try {
      if (row.type === 'skip') { onlyFields(row, ['student', 'type']); outcomes.push({ student: row.student, status: 'skipped' }); continue; }
      if (!['promotion', 'repeat', 'completion'].includes(row.type)) fail(400, 'Bulk choices are promotion, repeat, completion or skip');
      const preview = await previewTransition(req.user, row), key = `${row.academicYear}/${row.section}/${row.rollNumber}`;
      if (row.type !== 'completion' && slots.has(key)) fail(409, 'Two selected students request the same destination roll');
      if (row.type !== 'completion') slots.add(key);
      outcomes.push({ student: row.student, status: 'ready', ...preview });
    } catch (e) { outcomes.push({ student: row.student, status: 'conflict', reason: e.status ? e.message : 'Preview failed' }); }
  }
  return { outcomes, policy: 'Each student commits atomically. Conflicts do not commit; retry uses the same transition identifiers.' };
}));
router.post('/bulk-commit', reply(async req => {
  onlyFields(req.body, ['tokens']);
  if (!Array.isArray(req.body.tokens) || !req.body.tokens.length || req.body.tokens.length > 100) fail(400, 'Choose 1-100 preview tokens');
  const outcomes = [];
  for (const [index, token] of req.body.tokens.entries()) try { const result = await commitTransition(req.user, token); outcomes.push({ index, student: result.transition.student, transitionId: result.transition.transitionId, status: result.alreadyCommitted ? 'already committed' : 'committed' }); } catch (e) { outcomes.push({ index, status: 'failed', reason: e.status ? e.message : 'Transition failed; no changes for this student' }); }
  return { outcomes };
}));
router.get('/export', asyncHandler(async (req, res) => {
  if (!req.query.academicYear) fail(400, 'Select an academic year for enrollment export');
  const book = new ExcelJS.Workbook(), sheet = book.addWorksheet('Enrollment history');
  sheet.columns = ['Admission ID', 'Student', 'Academic year', 'Class', 'Section', 'Roll', 'Start inclusive', 'End exclusive', 'Status', 'Transition'].map(header => ({ header, width: 24 }));
  let page = 1, result;
  do {
    result = await enrollmentList({ ...req.query, page: String(page), limit: '100' });
    for (const r of result.records) sheet.addRow([r.student?.admissionNo, r.student?.user?.fullname, r.academicYear?.name, r.schoolClass?.name, r.section?.name, r.rollNumber, r.startDate.toISOString().slice(0, 10), r.endDate.toISOString().slice(0, 10), r.status, r.transitionType].map(v => typeof v === 'string' && /^[=+@-]/.test(v) ? `'${v}` : v));
    page++;
  } while (page <= result.pagination.totalPages);
  res.attachment('enrollment-history.xlsx'); await book.xlsx.write(res); res.end();
}));
export default router;
