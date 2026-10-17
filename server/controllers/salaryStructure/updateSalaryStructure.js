import asyncHandler from 'express-async-handler';
import Model from '../../models/SalaryStructure.js';
import Balance from '../../models/TeacherSalary.js';
import { transaction } from '../../utils/transaction.js';
import { fail } from '../../utils/errors.js';
export const updateSalaryStructure = asyncHandler(async (req, res) => {
 const data = await transaction(async session => {
  const row = await Model.findOneAndUpdate({ _id: req.params.id }, { $inc: { __v: 1 } }, { session, new: true });
  if (!row) fail(404, 'Structure not found');
  if (await Balance.exists({ salaryStructure: row._id }).session(session)) fail(409, 'Issued structures are immutable. Deactivate this structure and create a new one for future obligations.');
  for (const key of ['basicSalary', 'allowance', 'deduction', 'effectiveFrom', 'description']) if (req.body[key] !== undefined) row[key] = req.body[key];
  row.updatedBy = req.user._id; await row.save({ session }); return row;
 });
 res.json({ success: true, data });
});
