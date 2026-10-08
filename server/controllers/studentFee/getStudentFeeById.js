import asyncHandler from "express-async-handler";
import StudentFee from "../../models/StudentFee.js";

export const getStudentFeeById = asyncHandler(async (req, res) => {

    const fee = await StudentFee.findById(req.params.id)
        .populate({
            path: "student",
            populate: {
                path: "user",
                select: "fullname email",
            },
        })
        .populate("feeStructure");

    if (!fee) {
        res.status(404);
        throw new Error("Student Fee not found");
    }

    res.status(200).json({

        success: true,

        data: fee,

    });

});