import asyncHandler from "express-async-handler";

import SalaryStructure from "../../models/SalaryStructure.js";
import Teacher from "../../models/Teacher.js";

export const createSalaryStructure = asyncHandler(async (req, res) => {

    const {
        teacher,
        basicSalary,
        allowance,
        deduction,
        effectiveFrom,
        description,
    } = req.body;

    const teacherExists = await Teacher.findById(teacher);

    if (!teacherExists || !teacherExists.isActive) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    const exists = await SalaryStructure.findOne({
        teacher,
        isActive: true,
    });

    if (exists) {
        res.status(400);
        throw new Error("Salary structure already exists");
    }

    const salary = await SalaryStructure.create({

        teacher,

        basicSalary,

        allowance,

        deduction,

        effectiveFrom,

        description,

        createdBy: req.user._id,

    });

    res.status(201).json({

        success: true,

        message: "Salary structure created successfully",

        data: salary,

    });

});