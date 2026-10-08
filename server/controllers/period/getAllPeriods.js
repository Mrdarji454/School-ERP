import asyncHandler from "express-async-handler";
import Period from "../../models/Period.js";

export const getAllPeriods = asyncHandler(async (req, res) => {

    const periods = await Period.find({
        isActive: true,
    }).sort({
        periodNumber: 1,
    });

    res.status(200).json({
        success: true,
        count: periods.length,
        data: periods,
    });

});