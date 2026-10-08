import asyncHandler from "express-async-handler";
import Notification from "../../models/Notification.js";

export const updateNotification = asyncHandler(async (req, res) => {

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    const {
        title,
        message,
        type,
        priority,
        publishDate,
        expiryDate,
        attachment,
    } = req.body;

    if (
        publishDate &&
        expiryDate &&
        new Date(expiryDate) < new Date(publishDate)
    ) {
        res.status(400);
        throw new Error("Expiry date cannot be before publish date");
    }

    notification.title = title ?? notification.title;
    notification.message = message ?? notification.message;
    notification.type = type ?? notification.type;
    notification.priority = priority ?? notification.priority;
    notification.publishDate = publishDate ?? notification.publishDate;
    notification.expiryDate = expiryDate ?? notification.expiryDate;
    notification.attachment = attachment ?? notification.attachment;
    notification.updatedBy = req.user._id;

    await notification.save();

    res.status(200).json({
        success: true,
        message: "Notification updated successfully",
        data: notification,
    });

});