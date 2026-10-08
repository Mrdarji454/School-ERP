import asyncHandler from "express-async-handler";
import FeePayment from "../../models/FeePayment.js";

export const getFeePaymentById = asyncHandler(async (req, res) => {

    const payment = await FeePayment.findById(req.params.id)
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