import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createTeacher } from "../controllers/teacher/createTeacher.js";
import { getAllTeachers } from "../controllers/teacher/getAllTeachers.js";
import { getTeacherById } from "../controllers/teacher/getTeacherById.js";
import { updateTeacher } from "../controllers/teacher/updateTeacher.js";
import { deleteTeacher } from "../controllers/teacher/deleteTeacher.js";
import { restoreTeacher } from "../controllers/teacher/restoreTeacher.js";

import { createTeacherValidator } from "../validators/teacherValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createTeacherValidator, validate, createTeacher);
router.get("/", protect, authorize("Admin"), getAllTeachers);
router.get("/:id", protect, authorize("Admin"), getTeacherById);
router.put("/:id", protect, authorize("Admin"), createTeacherValidator, validate, updateTeacher);
router.delete("/:id", protect, authorize("Admin"), deleteTeacher);
router.patch("/:id/restore", protect, authorize("Admin"), restoreTeacher);

export default router;