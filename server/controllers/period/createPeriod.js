import asyncHandler from "express-async-handler";

import Period from "../../models/Period.js";

export const createPeriod = asyncHandler(async (req, res) => {

    const {
        name,
        periodNumber,
        startTime,
        endTime,
        isBreak,
        description,
    } = req.body;

    // Duplicate Period Number
    const exists = await Period.findOne({
        periodNumber,
        isActive: true,
    });

    if (exists) {
        res.status(400);
        throw new Error("Period number already exists");
    }

    // Duplicate Name
    const nameExists = await Period.findOne({
        name,
        isActive: true,
    });

    if (nameExists) {
        res.status(400);
        throw new Error("Period name already exists");
    }

    // Time Validation
    if (startTime >= endTime) {
        res.status(400);
        throw new Error("End time must be after start time");
    }

    const period = await Period.create({
        name,
        periodNumber,
        startTime,
        endTime,
        isBreak,
        description,
        createdBy: req.user._id,

    });

    res.status(201).json({

        success: true,

        message: "Period created successfully",
        data: period,

    });

});