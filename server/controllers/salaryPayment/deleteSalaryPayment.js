import asyncHandler from "express-async-handler";

import SalaryPayment from "../../models/SalaryPayment.js";
import TeacherSalary from "../../models/TeacherSalary.js";

export const deleteSalaryPayment = asyncHandler(async (req, res) => {

    const payment = await SalaryPayment.findById(req.params.id);

    if (!payment) {
        res.status(404);
        throw new Error("Payment not found");
    }

    const salary = await TeacherSalary.findById(payment.teacherSalary);

    salary.paidAmount -= payment.amount;
    salary.remainingAmount += payment.amount;

    if (salary.paidAmount === 0) {

        salary.status = "Pending";

    } else {

        salary.status = "Partial";

    }

    await salary.save();

    await payment.deleteOne();

    res.status(200).json({
        success: true,
        message: "Salary payment deleted successfully",
    });

});