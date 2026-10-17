import asyncHandler from 'express-async-handler';
import { assignFee } from '../../services/financeIssuance.js';
export const createStudentFee = asyncHandler(async (req, res) => {
  const result = await assignFee(req.body.student, req.body.feeStructure, req.user);
  res.status(201).json({ success: true, data: result.record, alreadyAssigned: result.alreadyAssigned });
});
