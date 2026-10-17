import asyncHandler from 'express-async-handler';
import { generateSalary } from '../../services/financeIssuance.js';
export const generateTeacherSalary = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await generateSalary(req.body, req.user) }));
