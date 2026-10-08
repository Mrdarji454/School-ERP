import asyncHandler from "express-async-handler";
import StudentFee from "../../models/StudentFee.js";

export const getAllStudentFees = asyncHandler(async (req, res) => {

    const fees = await StudentFee.find({
        isActive: true,
    })
        .populate({
            path: "student",
            populate: {
                path: "user",
                select: "fullname email",
            },
        })
        .populate("feeStructure");

    res.status(200).json({

        success: true,

        count: fees.length,

        data: fees,

    });

});