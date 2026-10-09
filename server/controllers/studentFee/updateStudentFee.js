import asyncHandler from "express-async-handler";
import StudentFee from "../../models/StudentFee.js";
import FeePayment from "../../models/FeePayment.js";
import { transaction } from "../../utils/transaction.js";
import { cents } from "../../services/paymentService.js";
import { fail } from "../../utils/errors.js";
export const updateStudentFee = asyncHandler(async (req, res) => {
 const total = cents(req.body.totalAmount) / 100;
 const data = await transaction(async session => {
  const fee = await StudentFee.findOne({ _id: req.params.id, isActive: true }).session(session);
  if (!fee) fail(404, "Active student fee not found");
  if (await FeePayment.exists({ studentFee: fee._id }).session(session)) fail(409, "An issued fee with payment history cannot change its amount");
  fee.totalAmount = total; fee.remainingAmount = total; fee.paymentStatus = total === 0 ? "Paid" : "Pending"; fee.updatedBy = req.user._id;
  await fee.save({ session }); return fee;
 }); res.json({ success: true, data });
});