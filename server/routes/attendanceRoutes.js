import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createAttendance } from "../controllers/attendance/createAttendance.js";
import { getAllAttendance } from "../controllers/attendance/getAllAttendance.js";
import { getAttendanceById } from "../controllers/attendance/getAttendanceById.js";
import { updateAttendance } from "../controllers/attendance/updateAttendance.js";
import { deleteAttendance } from "../controllers/attendance/deleteAttendance.js";

import { createAttendanceValidator } from "../validators/attendanceValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin", "Teacher"), createAttendanceValidator, validate, createAttendance);
router.get("/", protect, authorize("Admin", "Teacher"), getAllAttendance);
router.get("/:id", protect, authorize("Admin", "Teacher"), getAttendanceById);
router.put("/:id", protect, authorize("Admin", "Teacher"), createAttendanceValidator, validate, updateAttendance);
router.delete("/:id", protect, authorize("Admin"), deleteAttendance);

export default router;