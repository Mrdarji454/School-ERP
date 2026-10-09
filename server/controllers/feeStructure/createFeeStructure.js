import asyncHandler from "express-async-handler";
import FeeStructure from "../../models/FeeStructure.js";
import AcademicYear from "../../models/AcademicYear.js";
import { active } from "../../utils/relationships.js";
import { fail } from "../../utils/errors.js";
export const createFeeStructure = asyncHandler(async (req, res) => {
 const { academicYear, feeType, semester, amount, dueDate, lateFee, description } = req.body;
 await active(AcademicYear, academicYear);
 if (feeType === "Semester" && !semester) fail(400, "Semester is required");
 const data = await FeeStructure.create({ academicYear, feeType, semester: feeType === "Semester" ? semester : null, amount, dueDate, lateFee, description, createdBy: req.user._id });
 res.status(201).json({ success: true, data });
});