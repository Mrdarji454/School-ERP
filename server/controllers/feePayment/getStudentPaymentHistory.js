import asyncHandler from "express-async-handler";
import FeePayment from "../../models/FeePayment.js";

export const getStudentPaymentHistory = asyncHandler(async (req, res) => {

    const payments = await FeePayment.find({
        studentFee: req.params.studentFeeId,
    }).sort({
        paymentDate: -1,
    });

    res.status(200).json({

        success: true,

        count: payments.length,

        data: payments,

    });

});