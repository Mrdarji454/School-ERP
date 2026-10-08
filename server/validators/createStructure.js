import asyncHandler from "express-async-handler";

import FeeStructure from "../../models/FeeStructure.js";
import AcademicYear from "../../models/AcademicYear.js";

export const createFeeStructure = asyncHandler(async (req, res) => {

    const {
        academicYear,
        feeType,
        semester,
        amount,
        dueDate,
        lateFee,
        description,
    } = req.body;

    const year = await AcademicYear.findById(academicYear);

    if (!year) {
        res.status(404);
        throw new Error("Academic Year not found");
    }

    if (feeType === "Semester" && !semester) {
        res.status(400);
        throw new Error("Semester is required");
    }

    const exists = await FeeStructure.findOne({
        academicYear,
        feeType,
        semester: feeType === "Semester" ? semester : null,
        isActive: true,
    });

    if (exists) {
        res.status(400);
        throw new Error("Fee Structure already exists");
    }

    const feeStructure = await FeeStructure.create({
        academicYear,
        feeType,
        semester: feeType === "Semester" ? semester : null,
        amount,
        dueDate,
        lateFee,
        description,
        createdBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        message: "Fee Structure created successfully",
        data: feeStructure,
    });

});