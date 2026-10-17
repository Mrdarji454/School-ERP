import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { financeTypes, cents } from './paymentService.js';
import { fail } from '../utils/errors.js';
import { schoolDate } from '../utils/schoolDate.js';
import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
const same = (a, b) => String(a?._id || a) === String(b?._id || b);
const label = v => v?.name || 'Unknown';
export const receiptNumber = (kind, payment) => payment.receiptNumber || `${kind === 'fee' ? 'F' : 'S'}-LEGACY-${createHash('sha256').update(String(payment._id)).digest('hex').slice(0, 32)}`;
export async function financeScope(kind, actor) {
  const c = financeTypes[kind]; if (!c) fail(404, 'Unknown finance type');
  if (actor.role === 'Admin') return {};
  if (actor.role !== c.role) fail(403, 'Access denied');
  const profile = await c.Profile.findOne({ user: actor._id, isActive: true }).select('_id');
  if (!profile) fail(403, 'Active personal profile required');
  return { [c.owner]: profile._id };
}
function validateFilters(query) {
  for (const v of Object.values(query)) if (typeof v !== 'string') fail(400, 'Invalid finance filter');
  for (const key of ['academicYear', 'schoolClass', 'section', 'owner', 'balance']) if (query[key] && !mongoose.isObjectIdOrHexString(query[key])) fail(400, `Invalid ${key}`);
  if (query.status && !['Pending', 'Partial', 'Paid'].includes(query.status)) fail(400, 'Invalid payment status');
  if (query.reversed && !['true', 'false'].includes(query.reversed)) fail(400, 'Invalid reversal filter');
  for (const key of ['from', 'to']) if (query[key]) schoolDate(query[key]);
  if (query.from && query.to && query.from > query.to) fail(400, 'Invalid payment date range');
  for (const [key, min, max] of [['month', 1, 12], ['year', 1900, 2200]]) if (query[key] && (!Number.isInteger(Number(query[key])) || Number(query[key]) < min || Number(query[key]) > max)) fail(400, `Invalid salary ${key}`);
}
function schoolDay(value) { return new Intl.DateTimeFormat('en-CA', { timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)); }
export async function financeRows(kind, actor, query = {}) {
  validateFilters(query);
  const c = financeTypes[kind], scope = await financeScope(kind, actor);
  let cursor = c.Balance.find(scope).select(kind === 'fee' ? 'student feeStructure totalAmount paidAmount remainingAmount paymentStatus academicYear schoolClass section dueDate feeDescription snapshotVersion isActive createdAt' : 'teacher salaryStructure month year basicSalary allowance grossSalary deduction netSalary paidAmount remainingAmount status description snapshotVersion isActive createdAt');
  cursor = cursor.populate({ path: c.owner, select: `${kind === 'fee' ? 'admissionNo' : 'employeeId'} user`, populate: { path: 'user', select: 'fullname' } });
  if (kind === 'fee') cursor = cursor.populate({ path: 'feeStructure', select: 'academicYear feeType semester description', populate: { path: 'academicYear', select: 'name' } }).populate('academicYear', 'name').populate('schoolClass', 'name').populate('section', 'name');
  const balances = (await cursor.sort({ createdAt: -1, _id: 1 }).lean()).map(r => ({ _id: r._id, ownerId: r[c.owner]?._id, name: r[c.owner]?.user?.fullname || 'Missing profile', identifier: r[c.owner]?.[kind === 'fee' ? 'admissionNo' : 'employeeId'] || 'Unknown', academicYearId: r.academicYear?._id || r.feeStructure?.academicYear?._id, academicYear: label(r.academicYear || r.feeStructure?.academicYear), schoolClassId: r.schoolClass?._id, sectionId: r.section?._id, schoolClass: label(r.schoolClass), section: label(r.section), description: kind === 'fee' ? r.feeDescription || `Legacy ${r.feeStructure?.feeType || 'fee'} obligation (original description not snapshotted)` : r.description || 'Salary obligation', dueDate: r.dueDate || null, snapshotKnown: Boolean(r.snapshotVersion), month: r.month, year: r.year, basicSalary: r.basicSalary ?? null, allowance: r.allowance ?? null, grossSalary: r.grossSalary, deduction: r.deduction, total: r[c.total], paid: r.paidAmount, outstanding: r.remainingAmount, status: r[c.status], isActive: r.isActive, createdAt: r.createdAt }));
  const filtered = balances.filter(r => (!query.owner || same(r.ownerId, query.owner)) && (!query.balance || same(r._id, query.balance)) && (!query.academicYear || same(r.academicYearId, query.academicYear)) && (!query.schoolClass || same(r.schoolClassId, query.schoolClass)) && (!query.section || same(r.sectionId, query.section)) && (!query.status || r.status === query.status) && (!query.month || r.month === Number(query.month)) && (!query.year || r.year === Number(query.year)) && (!query.search || `${r.name} ${r.identifier}`.toLowerCase().includes(query.search.toLowerCase().slice(0, 100))));
  const payments = await c.Payment.find({ [c.link]: { $in: filtered.map(r => r._id) } }).select(`${c.link} amount paymentDate paymentMethod ${c.reference} remarks ${c.actor} isReversed reversedAt reversedBy reversalReason receiptNumber`).populate(c.actor, 'fullname').populate('reversedBy', 'fullname').sort({ paymentDate: -1, _id: 1 }).lean();
  const paymentRows = payments.filter(p => (!query.from || schoolDay(p.paymentDate) >= query.from) && (!query.to || schoolDay(p.paymentDate) <= query.to) && (!query.reversed || Boolean(p.isReversed) === (query.reversed === 'true'))).map(p => ({ _id: p._id, balanceId: p[c.link], receiptNumber: receiptNumber(kind, p), amount: p.amount, paymentDate: p.paymentDate, method: p.paymentMethod, reference: p[c.reference] || '', remarks: p.remarks, staff: p[c.actor]?.fullname || 'Staff not recorded', reversed: Boolean(p.isReversed), reversedAt: p.reversedAt, reversedBy: p.reversedBy?.fullname || '', reversalReason: p.reversalReason || '', obligation: filtered.find(b => same(b._id, p[c.link])) }));
  const sum = (rows, key) => rows.reduce((n, r) => n + cents(r[key]), 0) / 100;
  return { balances: filtered, payments: paymentRows, summary: { obligations: sum(filtered, 'total'), paidAgainstObligations: sum(filtered, 'paid'), outstanding: sum(filtered, 'outstanding'), recordedPayments: sum(paymentRows.filter(p => !p.reversed), 'amount'), reversedPayments: sum(paymentRows.filter(p => p.reversed), 'amount') }, scope: 'Balances include active and inactive matching obligations and are all-time. Class/section are issuance snapshots; legacy unknown placements are excluded by those filters. Payment dates/reversal filters apply only to payments, not obligation balances. Collections exclude reversed payments. Salary year/month refer to payroll periods, not academic years.' };
}
export async function financeList(kind, actor, query) {
  const rows = await financeRows(kind, actor, query), view = query.view === 'payments' ? 'payments' : 'balances';
  const limit = Number(query.limit || 20), requested = Number(query.page || 1);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(requested) || requested < 1) fail(400, 'Invalid pagination');
  const total = rows[view].length, totalPages = Math.max(1, Math.ceil(total / limit)), page = Math.min(requested, totalPages);
  return { records: rows[view].slice((page - 1) * limit, page * limit), summary: rows.summary, scope: rows.scope, pagination: { total, totalPages, page, limit }, timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' };
}
export async function feeCandidates(query) {
  validateFilters(query); if (!query.academicYear) return { records: [] };
  const enrollments = await Enrollment.find({ academicYear: query.academicYear }).sort({ startDate: -1 }).lean();
  const latest = [...new Map(enrollments.toReversed().map(e => [String(e.student), e])).values()].filter(e => (!query.schoolClass || same(e.schoolClass, query.schoolClass)) && (!query.section || same(e.section, query.section)));
  const students = await Student.find({ _id: { $in: latest.map(e => e.student) }, isActive: true }).select('admissionNo user').populate('user', 'fullname isActive').lean();
  return { records: students.filter(s => s.user?.isActive && (!query.search || `${s.admissionNo} ${s.user.fullname}`.toLowerCase().includes(query.search.toLowerCase()))).map(s => ({ _id: s._id, name: s.user.fullname, identifier: s.admissionNo })) };
}
export const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function financeDocument(kind, actor, id, statement = false) {
  const data = await financeRows(kind, actor, statement ? { balance: id } : {});
  const payment = statement ? null : data.payments.find(p => same(p._id, id)), balance = statement ? data.balances[0] : payment?.obligation;
  if (!balance) fail(404, 'Financial document not found');
  const pairs = [['School', process.env.SCHOOL_NAME || 'Vedant Vidhya Sankul'], ['Document', statement ? `${kind === 'fee' ? 'Fee' : 'Salary'} statement` : kind === 'fee' ? 'Fee receipt' : 'Salary payment acknowledgment'], ['Name', balance.name], ['Identifier', balance.identifier], ['Academic year / salary period', kind === 'fee' ? balance.academicYear : `${balance.year}-${String(balance.month).padStart(2, '0')}`], ['Obligation', balance.description], ['Original amount', balance.total], ['Paid against obligation', balance.paid], ['Outstanding', balance.outstanding], ['Due date', balance.dueDate ? new Date(balance.dueDate).toISOString().slice(0, 10) : 'Not recorded']];
  if (kind === 'salary') pairs.push(['Basic salary', balance.basicSalary ?? 'Not snapshotted'], ['Allowance', balance.allowance ?? 'Not snapshotted'], ['Gross salary', balance.grossSalary], ['Deduction', balance.deduction]);
  const entries = payment ? [payment] : data.payments;
  const time = date => date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' }).format(new Date(date)) : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(payment?.receiptNumber || 'Financial statement')}</title><style>body{font:16px system-ui;color:#12233e;max-width:850px;margin:32px auto;padding:20px}h1{border-bottom:3px solid #b99243;padding-bottom:16px}dl{display:grid;grid-template-columns:1fr 2fr;gap:12px}dd{margin:0;overflow-wrap:anywhere}article{border:1px solid #bcc5d0;padding:18px;margin:20px 0;break-inside:avoid}.reversed{color:#a12626}small{color:#475569}@media print{body{margin:0;max-width:none}}</style></head><body><h1>${escapeHtml(pairs[0][1])}</h1><dl>${pairs.slice(1).map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}</dl>${entries.map(p => `<article><h2>${escapeHtml(p.receiptNumber)}</h2><p class="${p.reversed ? 'reversed' : ''}">${p.reversed ? 'REVERSED — excluded from collected totals' : 'Recorded payment'}</p><p>Amount: ${escapeHtml(p.amount)} · ${escapeHtml(p.method)}</p><p>Recorded ${escapeHtml(time(p.paymentDate))} (${escapeHtml(process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata')})</p><p>Reference: ${escapeHtml(p.reference || 'Not recorded')}<br>Receiving/recording staff: ${escapeHtml(p.staff)}</p><p>${escapeHtml(p.remarks)}</p>${p.reversed ? `<p>Reversed by ${escapeHtml(p.reversedBy)}, ${escapeHtml(time(p.reversedAt))}. Reason: ${escapeHtml(p.reversalReason)}</p>` : ''}</article>`).join('')}<small>Recorded collections only; no gateway verification or money transfer is implied. An accounting reversal is not a bank refund. Balances reflect the time this document was downloaded; re-download to see later reversals. Use your browser's Print command to print or save as PDF.</small></body></html>`;
}
