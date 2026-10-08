import asyncHandler from "express-async-handler";
import Notification from "../../models/Notification.js";

export const getNotificationById = asyncHandler(async (req, res) => {

    const notification = await Notification.findById(req.params.id)
        .populate("createdBy", "fullname email");

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    res.status(200).json({
        success: true,
        data: notification,
    });

});