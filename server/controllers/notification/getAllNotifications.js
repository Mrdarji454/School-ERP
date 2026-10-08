import asyncHandler from "express-async-handler";
import Notification from "../../models/Notification.js";

export const getAllNotifications = asyncHandler(async (req, res) => {

    const notifications = await Notification.find({
        isActive: true,
    })
        .populate("createdBy", "fullname email")
        .sort({ publishDate: -1 });

    res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
    });

});