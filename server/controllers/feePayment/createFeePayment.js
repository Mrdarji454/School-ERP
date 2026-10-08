import asyncHandler from "express-async-handler";

import FeePayment from "../../models/FeePayment.js";
import StudentFee from "../../models/StudentFee.js";

export const createFeePayment = asyncHandler(async (req, res) => {

    const {
        studentFee,
        amount,
        paymentMethod,
        transactionId,
        remarks,
    } = req.body;

    const fee = await StudentFee.findById(studentFee);

    if (!fee) {
        res.status(404);
        throw new Error("Student Fee not found");
    }

    if (fee.paymentStatus === "Paid") {
        res.status(400);
        throw new Error("Fee already paid");
    }

    if (amount > fee.remainingAmount) {
        res.status(400);
        throw new Error("Amount exceeds remaining balance");
    }

    const payment = await FeePayment.create({

        studentFee,

        amount,

        paymentMethod,

        transactionId,

        remarks,

        receivedBy: req.user._id,

    });

    fee.paidAmount += amount;

    fee.remainingAmount -= amount;

    if (fee.remainingAmount === 0) {

        fee.paymentStatus = "Paid";

    } else {

        fee.paymentStatus = "Partial";

    }

    await fee.save();

    res.status(201).json({

        success: true,

        message: "Payment received successfully",

        data: payment,

    });

});