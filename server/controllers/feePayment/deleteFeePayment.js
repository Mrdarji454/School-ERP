import asyncHandler from "express-async-handler";

import FeePayment from "../../models/FeePayment.js";
import StudentFee from "../../models/StudentFee.js";

export const deleteFeePayment = asyncHandler(async (req, res) => {

    const payment = await FeePayment.findById(req.params.id);

    if (!payment) {
        res.status(404);
        throw new Error("Payment not found");
    }

    const fee = await StudentFee.findById(payment.studentFee);

    fee.paidAmount -= payment.amount;
    fee.remainingAmount += payment.amount;

    if (fee.paidAmount === 0) {
        fee.paymentStatus = "Pending";
    } else {
        fee.paymentStatus = "Partial";
    }

    await fee.save();

    await payment.deleteOne();

    res.status(200).json({

        success: true,

        message: "Payment deleted successfully",

    });

});