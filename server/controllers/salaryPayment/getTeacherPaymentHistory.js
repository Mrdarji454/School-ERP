import asyncHandler from "express-async-handler";
import SalaryPayment from "../../models/SalaryPayment.js";

export const getTeacherPaymentHistory = asyncHandler(async (req, res) => {

    const payments = await SalaryPayment.find({
        teacherSalary: req.params.teacherSalaryId,
    }).sort({
        paymentDate: -1,
    });

    res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
    });

});