import express from "express";

import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createNotification } from "../controllers/notification/createNotification.js";
import { getAllNotifications } from "../controllers/notification/getAllNotifications.js";
import { getNotificationById } from "../controllers/notification/getNotificationById.js";
import { updateNotification } from "../controllers/notification/updateNotification.js";
import { deleteNotification } from "../controllers/notification/deleteNotification.js";
import { restoreNotification } from "../controllers/notification/restoreNotification.js";
import { getActiveNotifications } from "../controllers/notification/getActiveNotifications.js";

import { createNotificationValidator } from "../validators/notificationValidator.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("Admin"),
    createNotificationValidator,
    validate,
    createNotification
);

router.get(
    "/",
    protect,
    authorize("Admin"),
    getAllNotifications
);

router.get(
    "/active",
    protect,
    getActiveNotifications
);

router.get(
    "/:id",
    protect,
    getNotificationById
);

router.put(
    "/:id",
    protect,
    authorize("Admin"),
    createNotificationValidator,
    validate,
    updateNotification
);

router.delete(
    "/:id",
    protect,
    authorize("Admin"),
    deleteNotification
);

router.patch(
    "/:id/restore",
    protect,
    authorize("Admin"),
    restoreNotification
);

export default router;