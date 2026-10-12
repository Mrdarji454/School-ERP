import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import fs from 'node:fs';
import { protect } from '../middleware/authMIddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { resourceList, resourceDetail, resourceFile, createResource, updateResource } from '../services/learningResources.js';
import { maxPdfBytes, privatePath } from '../services/privateStorage.js';
import { workflowOptions } from '../services/workflow.js';
import { managementOptions } from '../services/adminManagement.js';
import { fail } from '../utils/errors.js';
import { onlyFields } from '../services/profileValidation.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import AcademicYear from '../models/AcademicYear.js';
import { audienceScope } from '../services/academicAccess.js';
import { listCommunications } from '../services/communications.js';
import { schoolToday } from '../utils/schoolDate.js';
const router = express.Router();
router.use(protect, authorize('Admin', 'Teacher', 'Student'));
const reply = fn => asyncHandler(async (req, res) => res.json({ success: true, data: await fn(req) }));
router.get('/options', reply(async req => {
  const admin = req.user.role === 'Admin', scope = admin ? null : await audienceScope(req.user);
  return { ...(admin ? { ...await managementOptions(), uploaders: await User.find({ role: { $in: ['Admin', 'Teacher'] } }).select('fullname role').lean() } : { ...await workflowOptions(req.user), calendarYears: await AcademicYear.find({ _id: { $in: scope.years } }).select('name').lean() }), ...(req.user.role === 'Student' ? { resourceSubjects: await Subject.find({ schoolClass: { $in: scope.classes }, isActive: true }).select('name schoolClass').lean() } : {}), maxFileBytes: maxPdfBytes(), timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' };
}));
router.get('/', reply(req => resourceList(req.user, req.query)));
router.get('/summary', reply(async req => {
  const [resources, notices, calendar] = await Promise.all([resourceList(req.user, { limit: '1' }), listCommunications('notices', req.user, { limit: '1' }, true), listCommunications('calendar', req.user, { limit: '1', from: schoolToday().toISOString().slice(0, 10), status: 'active' })]);
  return { resources: resources.pagination.total, notices: notices.pagination.total, calendar: calendar.pagination.total };
}));
router.post('/', authorize('Admin', 'Teacher'), (req, res, next) => multer({ storage: multer.memoryStorage(), preservePath: true, limits: { fileSize: maxPdfBytes(), files: 1, fields: 1, fieldSize: 64 * 1024 } }).single('file')(req, res, next), reply(async req => {
  onlyFields(req.body, ['metadata']);
  let data; try { data = JSON.parse(req.body.metadata); } catch { fail(400, 'Valid metadata JSON is required'); }
  if (req.aborted) fail(400, 'Upload interrupted');
  return createResource(req.user, data, req.file);
}));
router.put('/:id', authorize('Admin', 'Teacher'), reply(req => updateResource(req.user, req.params.id, req.body)));
router.get('/:id/file', asyncHandler(async (req, res, next) => {
  const file = await resourceFile(req.user, req.params.id), target = await privatePath(file.key);
  // No key/path is sent to clients. Both inline previews and attachments pass auth.
  res.set({ 'Content-Type': 'application/pdf', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Content-Disposition': `${req.query.inline === 'true' ? 'inline' : 'attachment'}; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(file.name)}` });
  const stream = fs.createReadStream(target);
  stream.on('error', error => { if (!res.headersSent) next(Object.assign(new Error('Stored PDF is unavailable'), { status: error.code === 'ENOENT' ? 404 : 500 })); else res.destroy(); });
  res.on('close', () => stream.destroy()); stream.pipe(res);
}));
router.get('/:id', reply(req => resourceDetail(req.user, req.params.id)));
export default router;
