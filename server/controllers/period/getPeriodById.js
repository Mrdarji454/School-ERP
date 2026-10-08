import asyncHandler from "express-async-handler";
import Period from "../../models/Period.js";

export const getPeriodById = asyncHandler(async (req, res) => {

    const period = await Period.findById(req.params.id);

    if (!period) {
        res.status(404);
        throw new Error("Period not found");
    }

    res.status(200).json({
        success: true,
        data: period,
    });

});