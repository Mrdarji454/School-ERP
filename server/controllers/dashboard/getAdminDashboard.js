import asyncHandler from "express-async-handler";
import { dashboardData } from "../../services/dashboard/dashboardData.js";
export const getAdminDashboard = asyncHandler(async (req, res) => res.json({ success: true, data: await dashboardData(req.query.academicYear) }));