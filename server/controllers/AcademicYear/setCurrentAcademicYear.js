import asyncHandler from "express-async-handler";
import AcademicYear from "../../models/AcademicYear.js";
import { transaction } from "../../utils/transaction.js";
import { fail } from "../../utils/errors.js";
export const setCurrentAcademicYear = asyncHandler(async (req, res) => {
 const data = await transaction(async session => {
  const year = await AcademicYear.findOne({ _id: req.params.id, isActive: true }).session(session);
  if (!year) fail(404, "Active academic year not found");
  await AcademicYear.updateMany({}, { $set: { isCurrent: false }, $inc: { __v: 1 } }, { session });
  year.isCurrent = true; await year.save({ session }); return year;
 });
 res.json({ success: true, data });
});