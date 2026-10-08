import asyncHandler from "express-async-handler";
import Notification from "../../models/Notification.js";

export const createNotification = asyncHandler(async (req, res) => {

    const {
        title,
        message,
        type,
        priority,
        publishDate,
        expiryDate,
        attachment,
    } = req.body;

    if (expiryDate && new Date(expiryDate) < new Date(publishDate)) {
        res.status(400);
        throw new Error("Expiry date cannot be before publish date");
    }

    const notification = await Notification.create({
        title,
        message,
        type,
        priority,
        publishDate,
        expiryDate,
        attachment,
        createdBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: notification,
    });

});