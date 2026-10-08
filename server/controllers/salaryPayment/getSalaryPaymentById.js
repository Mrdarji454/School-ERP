import asyncHandler from "express-async-handler";
import SalaryPayment from "../../models/SalaryPayment.js";

export const getSalaryPaymentById = asyncHandler(async (req, res) => {

    const payment = await SalaryPayment.findById(req.params.id)
        .populate({
            path: "teacherSalary",
            populate: {
                path: "teacher",
                populate: {
                    path: "user",
                    select: "fullname email",
                },
            },
        });

    if (!payment) {
        res.status(404);
        throw new Error("Payment not found");
    }

    res.status(200).json({
        success: true,
        data: payment,
    });

});