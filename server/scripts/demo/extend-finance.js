import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import { demoConfig, connectDemo, manifestCollection, MANIFEST_ID, demoId } from './config.js';
import * as M from './models.js';
import { assignFee, generateSalary } from '../../services/financeIssuance.js';
import { recordPayment, reversePayment } from '../../services/paymentService.js';
import { financeRows, financeDocument } from '../../services/financeViews.js';
export const FINANCE_DEMO_ID = 'demo-finance-v1';
export async function extendFinance() {
  const seed = await manifestCollection().findOne({ _id: MANIFEST_ID });
  if (seed?.state !== 'complete') throw new Error('Completed base demo required');
  const previous = await manifestCollection().findOne({ _id: FINANCE_DEMO_ID });
  if (previous?.state === 'complete') return previous;
  const students = await M.Student.find({ _id: { $in: [1, 2, 3, 4, 5].map(n => demoId(`student/${n}`)) }, enrollmentManaged: true });
  if (students.length !== 5) throw new Error('Demo students 1–5 need explicit established enrollment first; this extension never initializes legacy history');
  const structureId = demoId('finance-extension/structure');
  const month = Number(seed.seedDate.slice(5, 7)) === 4 ? 5 : 4;
  for (let n = 1; n <= 3; n++) {
    const row = await M.TeacherSalary.findOne({ teacher: demoId(`teacher/${n}`), year: 2026, month });
    if (row && (!previous || String(row._id) !== String(demoId(`finance-extension/salary/${n}`)))) throw new Error('Unmanaged salary period collision');
  }
  if (!previous) {
    if (await M.FeeStructure.exists({ _id: structureId })) throw new Error('Unmanaged finance fixture collision');
    await manifestCollection().insertOne({ _id: FINANCE_DEMO_ID, state: 'building' });
  }
  const admin = await M.User.findById(demoId('admin'));
  if (!await M.FeeStructure.exists({ _id: structureId })) await M.FeeStructure.create({ _id: structureId, academicYear: demoId('year/current'), feeType: 'Semester', semester: 8, amount: 1000, dueDate: '2027-03-01', description: 'Demo finance exercise — no real collection', createdBy: admin._id });
  const fees = [];
  for (let n = 1; n <= 5; n++) {
    if (n < 5) fees.push((await assignFee(demoId(`student/${n}`), structureId, admin, undefined, demoId(`finance-extension/fee/${n}`))).record);
    else {
      // Explicit synthetic compatibility fixture: unknown historical due date, no backfill.
      let row = await M.StudentFee.findOne({ student: demoId('student/5'), feeStructure: structureId });
      if (row && String(row._id) !== String(demoId('finance-extension/fee/5'))) throw new Error('Unmanaged legacy fixture collision');
      if (!row) row = await M.StudentFee.create({ _id: demoId('finance-extension/fee/5'), student: demoId('student/5'), feeStructure: structureId, totalAmount: 1000, remainingAmount: 1000, createdBy: admin._id });
      fees.push(row);
    }
  }
  const feePayments = [];
  for (const [index, amount] of [[1, 250], [2, 1000], [3, 200]]) {
    const p = await recordPayment('fee', { studentFee: String(fees[index]._id), amount, paymentMethod: 'Cash', remarks: 'Synthetic finance exercise' }, admin, `demo_finance_fee_v1_${index}`);
    feePayments.push(p._id); if (index === 3) await reversePayment('fee', p._id, admin, 'Fictional accounting correction; no bank refund');
  }
  const salaries = [], salaryPayments = [];
  for (let n = 1; n <= 3; n++) {
    const teacher = demoId(`teacher/${n}`);
    const existing = await M.TeacherSalary.findOne({ teacher, year: 2026, month });
    // An existing manual period is never adopted on a first extension run.
    if (!previous && existing) throw new Error('Salary period collision; preserve the existing record and choose fixtures explicitly');
    const row = await generateSalary({ teacher, year: 2026, month }, admin, demoId(`finance-extension/salary/${n}`)); salaries.push(row._id);
    const p = await recordPayment('salary', { teacherSalary: String(row._id), amount: n === 2 ? row.netSalary : Math.round(row.netSalary * 50) / 100, paymentMethod: 'Cash', remarks: 'Synthetic salary acknowledgment' }, admin, `demo_finance_salary_v1_${n}`);
    salaryPayments.push(p._id); if (n === 3) await reversePayment('salary', p._id, admin, 'Synthetic payroll entry correction; no transfer');
  }
  const fixtureIds = { FeeStructure: [structureId], StudentFee: fees.map(f => f._id), FeePayment: feePayments, TeacherSalary: salaries, SalaryPayment: salaryPayments };
  await manifestCollection().updateOne({ _id: FINANCE_DEMO_ID }, { $set: { state: 'complete', fixtureIds, completedAt: new Date() } });
  return manifestCollection().findOne({ _id: FINANCE_DEMO_ID });
}
export async function verifyFinanceDemo() {
  const manifest = await manifestCollection().findOne({ _id: FINANCE_DEMO_ID }); assert.equal(manifest?.state, 'complete');
  const fees = await M.StudentFee.find({ _id: { $in: manifest.fixtureIds.StudentFee } }).sort({ student: 1 });
  assert.equal(fees.length, 5); assert.ok(fees.some(f => f.paymentStatus === 'Pending')); assert.ok(fees.some(f => f.paymentStatus === 'Partial')); assert.ok(fees.some(f => f.paymentStatus === 'Paid')); assert.ok(fees.some(f => !f.dueDate));
  const payments = await M.FeePayment.find({ _id: { $in: manifest.fixtureIds.FeePayment } }); assert.equal(payments.filter(p => p.isReversed).length, 1); assert.equal(new Set(payments.map(p => p.receiptNumber)).size, 3);
  const admin = await M.User.findById(demoId('admin'));
  const report = await financeRows('fee', admin, {});
  assert.equal(report.payments.filter(p => manifest.fixtureIds.FeePayment.some(id => String(id) === String(p._id)) && !p.reversed).reduce((sum, p) => sum + p.amount, 0), 1250);
  assert.ok((await financeDocument('fee', admin, String(payments.find(p => p.isReversed)._id))).includes('REVERSED'));
  const salaries = await M.TeacherSalary.find({ _id: { $in: manifest.fixtureIds.TeacherSalary } });
  assert.deepEqual(salaries.map(s => s.status).sort(), ['Paid', 'Partial', 'Pending']);
  return { obligations: 5, feePayments: 3, salaryPeriods: 3, salaryPayments: 3, nonReversedFeeCollections: 1250, unknownDueDates: fees.filter(f => !f.dueDate).length };
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/extend-finance.js')) {
  try { await connectDemo(demoConfig()); if (!process.argv.includes('--verify')) await extendFinance(); console.log(JSON.stringify(await verifyFinanceDemo(), null, 2)); }
  catch { console.error('Finance demo failed. Check explicit demo URI, enrolled fixture students, available structure/period scopes and completed seed. Existing records were not reset.'); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
}
