import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { listManagement, managementOptions, classDependencies } from "../services/adminManagement.js";

const router = express.Router();
router.use(protect, authorize("Admin"));
router.get("/options", asyncHandler(async (_req, res) => res.json({ success: true, data: await managementOptions() })));
router.get("/classes/:id/dependencies", asyncHandler(async (req, res) => res.json({ success: true, data: await classDependencies(req.params.id) })));
router.get("/:resource", asyncHandler(async (req, res) => res.json({ success: true, data: await listManagement(req.params.resource, req.query) })));
export default router;
