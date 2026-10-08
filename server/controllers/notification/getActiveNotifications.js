import asyncHandler from "express-async-handler";
import Notification from "../../models/Notification.js";

export const getActiveNotifications = asyncHandler(async (req, res) => {

    const today = new Date();

    const notifications = await Notification.find({
        isActive: true,
        publishDate: { $lte: today },
        $or: [
            { expiryDate: null },
            { expiryDate: { $gte: today } },
        ],
    })
        .sort({
            priority: -1,
            publishDate: -1,
        });

    res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
    });

});