import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import fs from 'node:fs';
import { protect } from '../middleware/authMIddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import * as assignments from '../services/assignments.js';
import { maxPdfBytes, privatePath } from '../services/privateStorage.js';
import { onlyFields } from '../services/profileValidation.js';
import { fail } from '../utils/errors.js';
const router = express.Router();
router.use(protect, authorize('Admin', 'Teacher', 'Student'));
const reply = fn => asyncHandler(async (req, res) => res.json({ success: true, data: await fn(req) }));
const staff = authorize('Admin', 'Teacher');
const upload = (req, res, next) => multer({ storage: multer.memoryStorage(), preservePath: true, limits: { fileSize: maxPdfBytes(), files: 1, fields: 1, fieldSize: 128 * 1024 } }).single('file')(req, res, next);
function metadata(req) { onlyFields(req.body, ['metadata']); let input; try { input = JSON.parse(req.body.metadata); } catch { fail(400, 'Valid metadata JSON is required'); } if (req.aborted) fail(400, 'Upload interrupted'); return input; }
router.get('/', reply(req => assignments.assignmentList(req.user, req.query)));
router.post('/', staff, upload, reply(req => assignments.createAssignment(req.user, metadata(req), req.file)));
router.put('/:id', staff, reply(req => assignments.editAssignment(req.user, req.params.id, req.body)));
router.post('/:id/actions', staff, reply(req => assignments.assignmentAction(req.user, req.params.id, req.body)));
router.get('/:id/candidates', staff, reply(req => assignments.recipientCandidates(req.user, req.params.id)));
router.post('/:id/seen', authorize('Student'), reply(req => assignments.markFeedbackSeen(req.user, req.params.id)));
router.post('/:id/submissions', authorize('Student'), upload, reply(req => assignments.submitAssignment(req.user, req.params.id, metadata(req), req.file, req.get('Idempotency-Key'))));
router.put('/:id/submissions/:submission/evaluation', staff, reply(req => assignments.evaluateSubmission(req.user, req.params.id, req.params.submission, req.body)));
router.get('/:id/export', staff, asyncHandler(async (req, res) => {
  const row = await assignments.assignmentDetail(req.user, req.params.id);
  const cell = value => { let s = String(value ?? ''); if (/^[\s\u0000-\u001f]*[=+@-]/.test(s)) s = `'${s}`; return `"${s.replaceAll('"', '""')}"`; };
  const rows = [['Assignment', 'Student', 'Admission number', 'Section', 'Status', 'Version', 'Submitted at (UTC)', 'Late', 'Published score', 'Maximum marks', 'Published feedback']];
  for (const r of row.recipients) { const s = r.history[0], p = s?.evaluation?.published; rows.push([row.title, r.name, r.admissionNo, r.section?.name, r.status, s?.sequence ?? '', s?.submittedAt?.toISOString(), s ? (s.late ? 'Yes' : 'No') : '', p?.action === 'graded' ? p.score : s ? 'Ungraded' : 'Not submitted', row.maxMarks, p?.feedback || '']); }
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="assignment-status-scores.csv"', 'Cache-Control': 'private, no-store' }).send('\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n'));
}));
router.get(['/:id/file', '/:id/submissions/:submission/file'], asyncHandler(async (req, res, next) => {
  const file = await assignments.assignmentFile(req.user, req.params.id, req.params.submission);
  const target = await privatePath(file.key);
  res.set({ 'Content-Type': 'application/pdf', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Content-Disposition': `attachment; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(file.name)}` });
  const stream = fs.createReadStream(target); stream.on('error', error => { if (!res.headersSent) next(Object.assign(new Error('Stored PDF is unavailable'), { status: error.code === 'ENOENT' ? 404 : 500 })); else res.destroy(); }); res.on('close', () => stream.destroy()); stream.pipe(res);
}));
router.get('/:id', reply(req => assignments.assignmentDetail(req.user, req.params.id)));
export default router;
