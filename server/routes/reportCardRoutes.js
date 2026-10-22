import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMIddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import * as cards from '../services/reportCards.js';
const router = express.Router();
router.use(protect, authorize('Admin', 'Student'));
router.use((req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
const reply = fn => asyncHandler(async (req, res) => res.json({ success: true, data: await fn(req) }));
router.get('/sources', reply(req => cards.reportSources(req.user, req.query)));
router.get('/sources/:id/candidates', reply(req => cards.reportCandidates(req.user, req.params.id, req.query)));
router.post('/issue', reply(req => cards.issueReportCard(req.user, req.body)));
router.post('/batch', reply(req => cards.issueBatch(req.user, req.body)));
router.get('/', reply(req => cards.listReportCards(req.user, req.query)));
router.get('/:id/pdf', asyncHandler(async (req, res) => {
  const { card, buffer } = await cards.cardBytes(req.user, req.params.id);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `${req.query.preview === 'true' ? 'inline' : 'attachment'}; filename="report-card-${card._id}.pdf"`, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'self'" }).send(buffer);
}));
export default router;
