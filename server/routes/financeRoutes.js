import express from 'express';
import asyncHandler from 'express-async-handler';
import ExcelJS from 'exceljs';
import { protect } from '../middleware/authMIddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { financeList, financeRows, financeDocument, feeCandidates } from '../services/financeViews.js';
import { previewFees, commitFees } from '../services/financeIssuance.js';
const router = express.Router(); router.use(protect);
const reply = fn => asyncHandler(async (req, res) => res.json({ success: true, data: await fn(req) }));
router.get('/fee/candidates', authorize('Admin'), reply(req => feeCandidates(req.query)));
router.post('/fee/preview', authorize('Admin'), reply(req => previewFees(req.user, req.body)));
router.post('/fee/assign', authorize('Admin'), reply(req => commitFees(req.user, req.body.tokens)));
router.get('/:kind', reply(req => financeList(req.params.kind, req.user, req.query)));
router.get('/:kind/receipts/:id', asyncHandler(async (req, res) => { const html = await financeDocument(req.params.kind, req.user, req.params.id); res.attachment('payment-receipt.html').type('html').send(html); }));
router.get('/:kind/statements/:id', asyncHandler(async (req, res) => { const html = await financeDocument(req.params.kind, req.user, req.params.id, true); res.attachment('financial-statement.html').type('html').send(html); }));
router.get('/:kind/export', asyncHandler(async (req, res) => {
  const data = await financeRows(req.params.kind, req.user, req.query), payments = req.query.view === 'payments';
  const book = new ExcelJS.Workbook(), sheet = book.addWorksheet(payments ? 'Payments' : 'Balances');
  const headers = payments ? ['Receipt', 'Name', 'Identifier', 'Academic year', 'Salary period', 'Amount', 'Method', 'Reference', 'Payment timestamp UTC', 'School timezone', 'Reversed', 'Reversal reason'] : ['Name', 'Identifier', 'Academic year', 'Class at issue', 'Section at issue', 'Salary period', 'Description', 'Original', 'Paid', 'Outstanding', 'Status', 'Due date', 'Active obligation'];
  sheet.addRow(headers);
  for (const r of payments ? data.payments : data.balances) {
    const b = payments ? r.obligation : r;
    const values = payments ? [r.receiptNumber, b.name, b.identifier, b.academicYear, b.year ? `${b.year}-${b.month}` : '', r.amount, r.method, r.reference, r.paymentDate.toISOString(), process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata', r.reversed ? 'Yes' : 'No', r.reversalReason] : [b.name, b.identifier, b.academicYear, b.schoolClass, b.section, b.year ? `${b.year}-${b.month}` : '', b.description, b.total, b.paid, b.outstanding, b.status, b.dueDate ? b.dueDate.toISOString().slice(0, 10) : 'Unknown', b.isActive ? 'Yes' : 'No'];
    sheet.addRow(values.map(v => typeof v === 'string' && /^\s*[=+@-]/.test(v) ? `'${v}` : v));
  }
  const scope = book.addWorksheet('Scope'); scope.addRow([data.scope]); for (const [key, value] of Object.entries(data.summary)) scope.addRow([key, value]);
  res.attachment('finance-report.xlsx'); await book.xlsx.write(res); res.end();
}));
export default router;
