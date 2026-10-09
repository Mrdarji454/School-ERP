import asyncHandler from "express-async-handler";
import { financeTypes, recordPayment, reversePayment, paymentScope } from "../services/paymentService.js";
import { fail } from "../utils/errors.js";
export const createPayment = kind => asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await recordPayment(kind, req.body, req.user, req.get("Idempotency-Key")) }));
export const reverse = kind => asyncHandler(async (req, res) => res.json({ success: true, message: "Payment reversed; history retained", data: await reversePayment(kind, req.params.id, req.user, req.body.reason) }));
export const listPayments = kind => asyncHandler(async (req, res) => {
  const c = financeTypes[kind], scope = await paymentScope(kind, req.user);
  const requested = req.params.studentFeeId || req.params.teacherSalaryId;
  const conditions = [scope, ...(requested ? [{ [c.link]: requested }] : []), ...(req.params.id ? [{ _id: req.params.id }] : [])];
  const rows = await c.Payment.find({ $and: conditions }).sort({ paymentDate: -1 });
  if (req.params.id && !rows.length) fail(404, "Payment not found");
  res.json({ success: true, data: req.params.id ? rows[0] : rows });
});
