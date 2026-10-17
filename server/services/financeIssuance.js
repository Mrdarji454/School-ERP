import { createHmac, timingSafeEqual } from 'node:crypto';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Teacher from '../models/Teacher.js';
import FeeStructure from '../models/FeeStructure.js';
import SalaryStructure from '../models/SalaryStructure.js';
import StudentFee from '../models/StudentFee.js';
import TeacherSalary from '../models/TeacherSalary.js';
import { transaction } from '../utils/transaction.js';
import { fail } from '../utils/errors.js';
import { cents } from './paymentService.js';
export async function feePlan(studentId, structureId, session = null) {
  const student = await Student.findOne({ _id: studentId, isActive: true }).session(session);
  const structure = await FeeStructure.findOne({ _id: structureId, isActive: true }).session(session);
  if (!student || !structure || !await User.exists({ _id: student.user, isActive: true }).session(session)) fail(400, 'Active student account and fee structure required');
  const enrollment = await Enrollment.findOne({ student: student._id, academicYear: structure.academicYear }).sort({ startDate: -1 }).session(session);
  if (!enrollment) fail(409, 'Established enrollment in the obligation academic year is required; resolve legacy history explicitly');
  const existing = await StudentFee.findOne({ student: student._id, feeStructure: structure._id }).session(session);
  return { student, structure, enrollment, existing };
}
export async function assignFee(studentId, structureId, actor, expected, fixtureId) {
  if (actor.role !== 'Admin') fail(403, 'Admin permission required');
  return transaction(async session => {
    await FeeStructure.updateOne({ _id: structureId }, { $inc: { __v: 1 } }, { session, timestamps: false });
    await Student.updateOne({ _id: studentId }, { $inc: { __v: 1 } }, { session, timestamps: false });
    const p = await feePlan(studentId, structureId, session);
    if (p.existing && fixtureId && String(p.existing._id) !== String(fixtureId)) fail(409, 'Unmanaged fixture obligation collision');
    if (p.existing) return { record: p.existing, alreadyAssigned: true };
    if (expected && (p.structure.amount !== expected.amount || String(p.enrollment._id) !== expected.enrollment || p.structure.updatedAt.toISOString() !== expected.structureUpdatedAt)) fail(409, 'Assignment preview is stale; reload and preview again');
    const [record] = await StudentFee.create([{ ...(fixtureId ? { _id: fixtureId } : {}), student: p.student._id, feeStructure: p.structure._id, academicYear: p.structure.academicYear, schoolClass: p.enrollment.schoolClass, section: p.enrollment.section, dueDate: p.structure.dueDate, feeDescription: p.structure.description || `${p.structure.feeType}${p.structure.semester ? ` ${p.structure.semester}` : ''} fee`, snapshotVersion: 1, totalAmount: p.structure.amount, remainingAmount: p.structure.amount, paidAmount: 0, createdBy: actor._id }], { session });
    return { record, alreadyAssigned: false };
  });
}
const sign = value => createHmac('sha256', process.env.JWT_SECRET).update(value).digest('hex');
export async function previewFees(actor, data) {
  if (!Array.isArray(data.students) || !data.students.length || data.students.length > 100 || new Set(data.students).size !== data.students.length) fail(400, 'Select 1–100 distinct students');
  const outcomes = [];
  for (const student of data.students) try {
    const p = await feePlan(student, data.feeStructure);
    const input = { student, feeStructure: data.feeStructure, amount: p.structure.amount, enrollment: String(p.enrollment._id), structureUpdatedAt: p.structure.updatedAt.toISOString() };
    const value = Buffer.from(JSON.stringify({ ...input, actor: String(actor._id), expires: Date.now() + 900000 })).toString('base64url');
    outcomes.push({ student, amount: p.existing?.totalAmount ?? p.structure.amount, status: p.existing ? 'already assigned' : 'ready', token: `${value}.${sign(value)}` });
  } catch (e) { outcomes.push({ student, status: 'conflict', reason: e.status ? e.message : 'Invalid student or structure' }); }
  return { outcomes };
}
export async function commitFees(actor, tokens) {
  if (!Array.isArray(tokens) || !tokens.length || tokens.length > 100) fail(400, 'Select 1–100 preview tokens');
  const outcomes = [];
  for (const [index, token] of tokens.entries()) {
    let input;
    try {
      if (typeof token !== 'string' || token.length > 4000) fail(400, 'Invalid assignment preview');
      const [value, signature] = token.split('.');
      if (!/^[a-f0-9]{64}$/.test(signature || '') || !timingSafeEqual(Buffer.from(signature), Buffer.from(sign(value)))) fail(400, 'Invalid assignment preview');
      input = JSON.parse(Buffer.from(value, 'base64url').toString());
      if (input.actor !== String(actor._id) || input.expires < Date.now()) fail(409, 'Preview expired; preview again');
      const result = await assignFee(input.student, input.feeStructure, actor, input);
      outcomes.push({ index, student: input.student, status: result.alreadyAssigned ? 'already assigned' : 'assigned', amount: result.record.totalAmount });
    } catch (e) { outcomes.push({ index, student: input?.student, status: 'failed', reason: e.status ? e.message : 'Assignment failed; no obligation created for this row' }); }
  }
  return { outcomes };
}
export async function generateSalary(body, actor, fixtureId) {
  if (actor.role !== 'Admin') fail(403, 'Admin permission required');
  const month = Number(body.month), year = Number(body.year);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1900 || year > 2200) fail(400, 'Valid month and year required');
  return transaction(async session => {
    const teacher = await Teacher.findOneAndUpdate({ _id: body.teacher, isActive: true }, { $inc: { __v: 1 } }, { session, new: true });
    if (!teacher) fail(404, 'Active teacher required');
    const existing = await TeacherSalary.findOne({ teacher: teacher._id, month, year }).session(session);
    if (existing && fixtureId && String(existing._id) !== String(fixtureId)) fail(409, 'Unmanaged salary period collision');
    if (existing) return existing;
    const structure = await SalaryStructure.findOneAndUpdate({ teacher: teacher._id, isActive: true, effectiveFrom: { $lte: new Date(Date.UTC(year, month, 0)) } }, { $inc: { __v: 1 } }, { session, new: true });
    if (!structure) fail(404, 'Applicable active salary structure required');
    const gross = cents(structure.basicSalary) + cents(structure.allowance), net = gross - cents(structure.deduction);
    if (net < 0) fail(400, 'Deductions exceed gross salary');
    const [record] = await TeacherSalary.create([{ ...(fixtureId ? { _id: fixtureId } : {}), teacher: teacher._id, salaryStructure: structure._id, month, year, basicSalary: structure.basicSalary, allowance: structure.allowance, description: structure.description, snapshotVersion: 1, grossSalary: gross / 100, deduction: structure.deduction, netSalary: net / 100, remainingAmount: net / 100, paidAmount: 0 }], { session });
    return record;
  });
}
