import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMIddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { listCommunications, communicationDetail, saveCommunication, setCommunicationActive } from '../services/communications.js';
import { fail } from '../utils/errors.js';
const router = express.Router();
router.use(protect, authorize('Admin', 'Teacher', 'Student'));
router.param('kind', (_req, _res, next, value) => { if (!['notices', 'calendar'].includes(value)) return next(Object.assign(new Error('Not found'), { status: 404 })); next(); });
const reply = fn => asyncHandler(async (req, res) => res.json({ success: true, data: await fn(req) }));
router.get('/:kind', reply(req => listCommunications(req.params.kind, req.user, req.query)));
router.get('/:kind/:id', reply(req => communicationDetail(req.params.kind, req.user, req.params.id)));
router.post('/:kind', authorize('Admin'), reply(req => saveCommunication(req.params.kind, req.user, null, req.body)));
router.put('/:kind/:id', authorize('Admin'), reply(req => {
  if (!Number.isSafeInteger(req.body.version)) fail(428, 'Loaded version is required');
  return saveCommunication(req.params.kind, req.user, req.params.id, req.body);
}));
router.patch('/:kind/:id/active', authorize('Admin'), reply(req => {
  if (Object.keys(req.body).some(k => k !== 'isActive') || typeof req.body.isActive !== 'boolean') fail(400, 'Supply only boolean isActive');
  return setCommunicationActive(req.params.kind, req.user, req.params.id, req.body.isActive);
}));
export default router;
