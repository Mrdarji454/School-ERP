import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import { getAdminDashboard } from "../controllers/dashboard/getAdminDashboard.js";

const router = express.Router();

router.get(
    "/admin",
    protect,
    authorize("Admin"),
    getAdminDashboard
);

export default router;