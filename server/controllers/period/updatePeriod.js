import asyncHandler from "express-async-handler";
import Period from "../../models/Period.js";

export const updatePeriod = asyncHandler(async (req, res) => {

    const period = await Period.findById(req.params.id);

    if (!period) {
        res.status(404);
        throw new Error("Period not found");
    }

    const {
        name,
        periodNumber,
        startTime,
        endTime,
        isBreak,
        description,
    } = req.body;

    if (periodNumber && periodNumber !== period.periodNumber) {

        const exists = await Period.findOne({
            periodNumber,
            _id: { $ne: req.params.id },
            isActive: true,
        });

        if (exists) {
            res.status(400);
            throw new Error("Period number already exists");
        }
    }

    if (name && name !== period.name) {

        const exists = await Period.findOne({
            name,
            _id: { $ne: req.params.id },
            isActive: true,
        });

        if (exists) {
            res.status(400);
            throw new Error("Period name already exists");
        }
    }

    if (
        startTime &&
        endTime &&
        startTime >= endTime
    ) {
        res.status(400);
        throw new Error("End time must be after start time");
    }

    period.name = name ?? period.name;
    period.periodNumber = periodNumber ?? period.periodNumber;
    period.startTime = startTime ?? period.startTime;
    period.endTime = endTime ?? period.endTime;
    period.isBreak = isBreak ?? period.isBreak;
    period.description = description ?? period.description;
    period.updatedBy = req.user._id;

    await period.save();

    res.status(200).json({
        success: true,
        message: "Period updated successfully",
        data: period,
    });

});