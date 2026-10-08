import asyncHandler from "express-async-handler";

import Teacher from "../../models/Teacher.js";
import SalaryStructure from "../../models/SalaryStructure.js";
import TeacherSalary from "../../models/TeacherSalary.js";

export const generateTeacherSalary = asyncHandler(async (req, res) => {

    const { teacher, month, year } = req.body;

    const teacherExists = await Teacher.findById(teacher);

    if (!teacherExists) {
        res.status(404);
        throw new Error("Teacher not found");
    }

    const structure = await SalaryStructure.findOne({
        teacher,
        isActive: true,
    });

    if (!structure) {
        res.status(404);
        throw new Error("Salary structure not found");
    }

    const alreadyGenerated = await TeacherSalary.findOne({
        teacher,
        month,
        year,
        isActive: true,
    });

    if (alreadyGenerated) {
        res.status(400);
        throw new Error("Salary already generated for this month");
    }

    const grossSalary =
        structure.basicSalary + structure.allowance;

    const netSalary =
        grossSalary - structure.deduction;

    const salary = await TeacherSalary.create({

        teacher,

        salaryStructure: structure._id,

        month,

        year,

        grossSalary,

        deduction: structure.deduction,

        netSalary,

        paidAmount: 0,

        remainingAmount: netSalary,

        status: "Pending",

        isActive: true,

    });

    res.status(201).json({

        success: true,

        message: "Salary generated successfully",

        data: salary,

    });

});