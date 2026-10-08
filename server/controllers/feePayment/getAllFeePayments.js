import asyncHandler from "express-async-handler";
import FeePayment from "../../models/FeePayment.js";

export const getAllFeePayments = asyncHandler(async (req, res) => {

    const payments = await FeePayment.find()
        .populate({
            path: "studentFee",
            populate: [
                {
                    path: "student",
                    populate: {
                        path: "user",
                        select: "fullname",
                    },
                },
                {
                    path: "feeStructure",
                },
            ],
        })
        .populate("receivedBy", "fullname")
        .sort({ paymentDate: -1 });

    res.status(200).json({

        success: true,

        count: payments.length,

        data: payments,

    });

});