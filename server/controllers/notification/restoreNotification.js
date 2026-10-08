import asyncHandler from "express-async-handler";
import Notification from "../../models/Notification.js";

export const restoreNotification = asyncHandler(async (req, res) => {

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    notification.isActive = true;
    notification.updatedBy = req.user._id;

    await notification.save();

    res.status(200).json({
        success: true,
        message: "Notification restored successfully",
    });

});