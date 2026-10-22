import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMIddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { managementOptions } from '../services/adminManagement.js';
import User from '../models/User.js';
import * as exams from '../services/exams.js';
import { fail } from '../utils/errors.js';
const router = express.Router();
router.use(protect, authorize('Admin', 'Teacher', 'Student'));
const reply = fn => asyncHandler(async (req, res) => res.json({ success: true, data: await fn(req) }));
router.get('/options', authorize('Admin'), reply(async () => ({ ...await managementOptions(), evaluators: await User.find({ role: 'Teacher', isActive: true }).select('fullname').lean(), timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' })));
router.get('/results', reply(req => exams.resultList(req.user, req.query)));
router.get('/results/:id/:version', reply(req => exams.publishedResult(req.user, req.params.id, req.params.version, req.query.candidate)));
router.post('/results/:id/:version/seen', reply(req => exams.resultSeen(req.user, req.params.id, req.params.version)));
const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
router.get('/results/:id/:version/statement', asyncHandler(async (req, res) => {
  const p = await exams.publishedResult(req.user, req.params.id, req.params.version, req.query.candidate);
  if (p.results.length !== 1) fail(400, 'Choose exactly one candidate for a statement');
  const r = p.results[0], label = id => p.components.find(c => exams.same(c._id, id))?.subjectName || '';
  res.set({ 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': 'attachment; filename="result-statement.html"', 'Cache-Control': 'private, no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" }).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Result statement</title><style>body{font:16px system-ui;color:#14233b;max-width:900px;margin:24px auto;padding:16px}h1{border-bottom:3px solid #af8a3e;padding-bottom:12px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border:1px solid #ccd2da}p{overflow-wrap:anywhere}@media print{body{margin:0}tr{break-inside:avoid}}</style></head><body><h1>${escape(p.name)}</h1><p>${escape(r.name)} · ${escape(r.admissionNo)}<br>${escape(p.academicYearName)} · ${escape(r.className)} / ${escape(r.sectionName)} · Roll ${escape(r.rollNumber)}</p><p>Published version ${p.version} · ${escape(new Intl.DateTimeFormat('en-IN', { timeZone: p.timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(p.publishedAt))} (${escape(p.timeZone)})</p><table><thead><tr><th>Subject / component</th><th>State</th><th>Marks</th><th>Maximum</th><th>Configured component threshold</th></tr></thead><tbody>${r.marks.map(m => `<tr><td>${escape(label(m.component))} / ${escape(m.name)}</td><td>${escape(m.state)}</td><td>${m.score ?? '—'}</td><td>${m.maximum}</td><td>${m.passMarks == null ? 'Not configured' : `${m.passMarks} (${m.meetsComponentPassMark == null ? 'Not assessed' : m.meetsComponentPassMark ? 'Met' : 'Not met'})`}</td></tr>`).join('')}</tbody></table><p>${r.total == null ? escape(r.totalNote) : `Total ${r.total} / ${r.maximum} · ${r.percentage}%`}</p><p>Grade: ${escape(r.grade || 'Not configured / not calculable')} · Overall pass threshold: ${r.meetsOverallPassThreshold == null ? 'Not configured / not calculable' : r.meetsOverallPassThreshold ? 'Met' : 'Not met'}</p><p>Policy version ${p.policy.version}: ${escape(p.policy.aggregation)}; ${p.policy.decimals} decimal places, half-up rounding; absent: ${escape(p.policy.absent)}; exempt: ${escape(p.policy.exempt)}. Overall threshold is independent of component thresholds. Grades use rounded percentage.</p><p>This is a simple published-result statement, not an official signed report card or certificate. Use your browser’s Print command to print or save as PDF.</p></body></html>`);
}));
router.get('/', reply(req => exams.listExams(req.user, req.query)));
router.post('/', authorize('Admin'), reply(req => exams.saveExam(req.user, null, req.body)));
router.put('/:id', authorize('Admin'), reply(req => exams.saveExam(req.user, req.params.id, req.body)));
router.post('/:id/actions', authorize('Admin'), reply(req => exams.examAction(req.user, req.params.id, req.body)));
router.get('/:id/candidates', authorize('Admin'), reply(req => exams.candidateOptions(req.user, req.params.id, req.query.date)));
router.post('/:id/schedules', authorize('Admin'), reply(req => exams.saveSchedule(req.user, req.params.id, req.body)));
router.put('/:id/schedules/:schedule', authorize('Admin'), reply(req => exams.saveSchedule(req.user, req.params.id, req.body, req.params.schedule)));
router.put('/:id/components/:component/marks', authorize('Teacher'), reply(req => exams.saveMarks(req.user, req.params.id, req.params.component, req.body, req.get('Idempotency-Key'))));
router.get('/:id/export', asyncHandler(async (req, res) => {
  const kind = req.query.kind || 'schedule', rows = [];
  if (kind === 'results') {
    const p = await exams.publishedResult(req.user, req.params.id, req.query.version, req.query.candidate);
    rows.push(['PUBLISHED', 'Exam', 'Version', 'Student', 'Admission ID', 'Class', 'Section', 'Component', 'State', 'Score', 'Maximum', 'Total', 'Total maximum', 'Percentage', 'Grade']);
    for (const r of p.results.filter(r => !req.query.section || exams.same(r.section, req.query.section))) for (const m of r.marks) rows.push(['PUBLISHED', p.name, p.version, r.name, r.admissionNo, r.className, r.sectionName, `${p.components.find(c => exams.same(c._id, m.component))?.subjectName} / ${m.name}`, m.state, m.score ?? '', m.maximum, r.total ?? '', r.maximum ?? '', r.percentage ?? '', r.grade || '']);
  } else {
    const e = await exams.examDetail(req.user, req.params.id);
    if (kind === 'schedule') { rows.push(['Schedule (school timezone)', 'Exam', 'Component', 'Date', 'Start', 'End', 'Sections', 'Room', 'Invigilator', 'Active']); for (const s of e.schedules.filter(s => !req.query.section || s.sections.some(id => exams.same(id, req.query.section)))) rows.push([e.timeZone, e.name, e.components.find(c => exams.same(c._id, s.component))?.name, s.date.toISOString().slice(0, 10), s.startTime, s.endTime, s.sections.map(id => e.sections.find(v => exams.same(v, id))?.name).join(' / '), s.room, s.invigilatorName, s.active]); }
    else {
      if (req.user.role === 'Student' || (kind === 'review' && req.user.role !== 'Admin')) fail(403, 'Working marks/candidate reports are restricted');
      const candidates = e.candidates.filter(c => c.active && (!req.query.section || exams.same(c.section, req.query.section)));
      if (kind === 'candidates') { rows.push(['ROSTER SNAPSHOT', 'Exam', 'Student', 'Admission ID', 'Class', 'Section', 'Roll', 'Eligibility date', 'Captured']); for (const c of candidates) rows.push(['ROSTER SNAPSHOT', e.name, c.name, c.admissionNo, c.className, c.sectionName, c.rollNumber, c.eligibilityDate.toISOString().slice(0, 10), c.capturedAt.toISOString()]); }
      else if (['working', 'review'].includes(kind)) { rows.push(['WORKING — NOT PUBLISHED RESULTS', 'Exam', 'Student', 'Admission ID', 'Class', 'Section', 'Component', 'Review state', 'Entry state', 'Score', 'Maximum']); for (const c of e.components.filter(c => !req.query.component || exams.same(c._id, req.query.component))) for (const r of candidates.filter(r => c.sections.some(s => exams.same(s, r.section)))) { const v = e.entries.find(v => exams.same(v.candidate, r._id) && exams.same(v.component, c._id)); rows.push(['WORKING — NOT PUBLISHED RESULTS', e.name, r.name, r.admissionNo, r.className, r.sectionName, `${c.subjectName} / ${c.name}`, c.state, v?.state || 'Not entered', v?.score ?? '', c.maximum]); } }
      else fail(400, 'Unknown export type');
    }
  }
  const cell = v => { let s = String(v ?? ''); if (/^[\s\u0000-\u001f]*[=+@-]/.test(s)) s = `'${s}`; return `"${s.replaceAll('"', '""')}"`; };
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="exam-${['results', 'schedule', 'candidates', 'working', 'review'].includes(kind) ? kind : 'report'}.csv"`, 'Cache-Control': 'private, no-store' }).send('\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n'));
}));
router.get('/:id', reply(req => exams.examDetail(req.user, req.params.id)));
export default router;
