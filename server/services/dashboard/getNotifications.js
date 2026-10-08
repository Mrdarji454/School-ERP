import Notification from "../../models/Notification.js";

export const getNotifications = async () => {

    const today = new Date();

    return await Notification.find({
        isActive: true,
        publishDate: { $lte: today },
        $or: [
            { expiryDate: null },
            { expiryDate: { $gte: today } },
        ],
    })
        .sort({
            createdAt: -1,
        })
        .limit(5);

};