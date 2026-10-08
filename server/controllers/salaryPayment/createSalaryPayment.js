import asyncHandler from "express-async-handler";

import SalaryPayment from "../../models/SalaryPayment.js";
import TeacherSalary from "../../models/TeacherSalary.js";

export const createSalaryPayment = asyncHandler(async (req, res) => {

    const {
        teacherSalary,
        amount,
        paymentMethod,
        referenceNumber,
        remarks,
    } = req.body;

    const salary = await TeacherSalary.findById(teacherSalary);

    if (!salary) {
        res.status(404);
        throw new Error("Salary record not found");
    }

    if (salary.status === "Paid") {
        res.status(400);
        throw new Error("Salary already paid");
    }

    if (amount > salary.remainingAmount) {
        res.status(400);
        throw new Error("Amount exceeds remaining salary");
    }

    const payment = await SalaryPayment.create({

        teacherSalary,

        amount,

        paymentMethod,

        referenceNumber,

        remarks,

        paidBy: req.user._id,

    });

    salary.paidAmount += amount;
    salary.remainingAmount -= amount;

    if (salary.remainingAmount === 0) {

        salary.status = "Paid";

    } else {

        salary.status = "Partial";

    }

    await salary.save();

    res.status(201).json({

        success: true,

        message: "Salary paid successfully",

        data: payment,

    });

});