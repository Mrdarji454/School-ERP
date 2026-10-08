import asyncHandler from "express-async-handler";
import Period from "../../models/Period.js";

export const deletePeriod = asyncHandler(async (req, res) => {

    const period = await Period.findById(req.params.id);

    if (!period) {
        res.status(404);
        throw new Error("Period not found");
    }

    period.isActive = false;
    period.updatedBy = req.user._id;

    await period.save();

    res.status(200).json({
        success: true,
        message: "Period deleted successfully",
    });

});