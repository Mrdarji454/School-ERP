import FeePayment from "../models/FeePayment.js";
import SalaryPayment from "../models/SalaryPayment.js";
import StudentFee from "../models/StudentFee.js";
import TeacherSalary from "../models/TeacherSalary.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import { transaction } from "../utils/transaction.js";
import { fail } from "../utils/errors.js";
export const financeTypes = {
 fee: { Payment: FeePayment, Balance: StudentFee, Profile: Student, role: "Student", owner: "student", link: "studentFee", status: "paymentStatus", total: "totalAmount", actor: "receivedBy", reference: "transactionId" },
 salary: { Payment: SalaryPayment, Balance: TeacherSalary, Profile: Teacher, role: "Teacher", owner: "teacher", link: "teacherSalary", status: "status", total: "netSalary", actor: "paidBy", reference: "referenceNumber" },
};
export function cents(value) {
  const n = Number(value), scaled = n * 100;
  if (value === "" || value === null || typeof value === "boolean" || !Number.isFinite(n) || n < 0 || !Number.isSafeInteger(Math.round(scaled)) || Math.abs(scaled - Math.round(scaled)) > 0.00001) fail(400, "Use a nonnegative amount with at most two decimal places");
  return Math.round(scaled);
}
export function balanceAfter(total, paid, amount, reverse = false) {
  const t = cents(total), p = cents(paid), a = cents(amount);
  if (!a) fail(400, "Payment amount must be positive");
  const next = p + (reverse ? -a : a);
  if (next < 0 || next > t) fail(409, "Payment would exceed the balance or reverse unrecorded funds");
  return { paidAmount: next / 100, remainingAmount: (t - next) / 100, status: next === t ? "Paid" : next === 0 ? "Pending" : "Partial" };
}
export async function recordPayment(kind, body, user, key) {
  const c = financeTypes[kind];
  if (typeof key !== "string" || !/^[A-Za-z0-9:_-]{8,128}$/.test(key)) fail(400, "Send a stable Idempotency-Key header (8–128 characters) for each payment");
  const amount = cents(body.amount) / 100;
  const reference = typeof body[c.reference] === "string" ? body[c.reference].trim() : "";
  const match = existing => {
    if (String(existing[c.link]) !== String(body[c.link]) || existing.amount !== amount || existing.paymentMethod !== body.paymentMethod || (existing[c.reference] || "") !== reference) fail(409, "Idempotency key was already used for a different payment");
    return existing;
  };
  try {
    return await transaction(async session => {
      const existing = await c.Payment.findOne({ idempotencyKey: key }).session(session);
      if (existing) return match(existing);
      const balance = await c.Balance.findOne({ _id: body[c.link], isActive: true }).session(session);
      if (!balance) fail(404, "Active balance record not found");
      const next = balanceAfter(balance[c.total], balance.paidAmount, amount);
      balance.paidAmount = next.paidAmount; balance.remainingAmount = next.remainingAmount; balance[c.status] = next.status;
      await balance.save({ session });
      const [payment] = await c.Payment.create([{ [c.link]: balance._id, amount, paymentMethod: body.paymentMethod, [c.reference]: reference, remarks: body.remarks, [c.actor]: user._id, idempotencyKey: key, ...(reference ? { externalReference: reference } : {}) }], { session });
      return payment;
    });
  } catch (error) {
    if (error.code === 11000) { const existing = await c.Payment.findOne({ idempotencyKey: key }); if (existing) return match(existing); }
    throw error;
  }
}
export async function reversePayment(kind, id, user, reason) {
  if (typeof reason !== "string" || !reason.trim() || reason.length > 500) fail(400, "A reversal reason is required (up to 500 characters)");
  const c = financeTypes[kind];
  return transaction(async session => {
    const payment = await c.Payment.findById(id).session(session);
    if (!payment) fail(404, "Payment not found");
    if (payment.isReversed) return payment;
    const balance = await c.Balance.findById(payment[c.link]).session(session);
    if (!balance) fail(409, "Linked balance record not found");
    const next = balanceAfter(balance[c.total], balance.paidAmount, payment.amount, true);
    balance.paidAmount = next.paidAmount; balance.remainingAmount = next.remainingAmount; balance[c.status] = next.status;
    payment.isReversed = true; payment.reversedAt = new Date(); payment.reversedBy = user._id; payment.reversalReason = reason.trim();
    await balance.save({ session }); await payment.save({ session }); return payment;
  });
}
export async function paymentScope(kind, user) {
  if (user.role === "Admin") return {};
  const c = financeTypes[kind];
  if (user.role !== c.role) fail(403, "Access denied");
  const profile = await c.Profile.findOne({ user: user._id, isActive: true });
  if (!profile) fail(403, "Active profile required");
  const balances = await c.Balance.find({ [c.owner]: profile._id }).select("_id");
  return { [c.link]: { $in: balances.map(b => b._id) } };
}
