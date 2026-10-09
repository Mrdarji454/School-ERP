import { classSection, same } from "../../utils/relationships.js";
import { fail } from "../../utils/errors.js";
import asyncHandler from "express-async-handler";

import Student from "../../models/Student.js";
import FeeStructure from "../../models/FeeStructure.js";
import StudentFee from "../../models/StudentFee.js";

export const createStudentFee = asyncHandler(async (req, res) => {

    const { student, feeStructure } = req.body;

    const studentExists = await Student.findById(student);

    if (!studentExists || !studentExists.isActive) {
        res.status(404);
        throw new Error("Student not found");
    }

    const feeStructureExists = await FeeStructure.findById(feeStructure);

    if (!feeStructureExists || !feeStructureExists.isActive) {
        res.status(404);
        throw new Error("Fee Structure not found");
    }

    const cls = await classSection(studentExists.schoolClass, studentExists.section);
    if (!same(cls.academicYear, feeStructureExists.academicYear)) fail(400, "Student and fee academic years differ");
    const exists = await StudentFee.findOne({
        student,
        feeStructure,
        isActive: true,
    });

    if (exists) {
        res.status(400);
        throw new Error("Fee already assigned");
    }

    const studentFee = await StudentFee.create({

        student,

        feeStructure,

        totalAmount: feeStructureExists.amount,

        paidAmount: 0,

        remainingAmount: feeStructureExists.amount,

        paymentStatus: "Pending",

        createdBy: req.user._id,

    });

    res.status(201).json({

        success: true,

        message: "Fee assigned successfully",

        data: studentFee,

    });

});