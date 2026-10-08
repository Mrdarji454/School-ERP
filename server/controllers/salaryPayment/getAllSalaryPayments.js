import asyncHandler from "express-async-handler";
import SalaryPayment from "../../models/SalaryPayment.js";

export const getAllSalaryPayments = asyncHandler(async (req, res) => {

    const payments = await SalaryPayment.find()
        .populate({
            path: "teacherSalary",
            populate: {
                path: "teacher",
                populate: {
                    path: "user",
                    select: "fullname email",
                },
            },
        })
        .populate("paidBy", "fullname")
        .sort({ paymentDate: -1 });

    res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
    });

});