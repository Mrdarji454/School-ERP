import { academicRelations, restoreAcademic } from "../middleware/academicRelations.js";
import express from "express";

import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createTeacherAssignment } from "../controllers/teacherAssignment/createTeacherAssignment.js";
import { getAllTeacherAssignments } from "../controllers/teacherAssignment/getAllTeacherAssignments.js";
import { getTeacherAssignmentById } from "../controllers/teacherAssignment/getTeacherAssignmentById.js";
import { updateTeacherAssignment } from "../controllers/teacherAssignment/updateTeacherAssignment.js";
import { deleteTeacherAssignment } from "../controllers/teacherAssignment/deleteTeacherAssignment.js";

import { createTeacherAssignmentValidator } from "../validators/teacherAssignmentValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createTeacherAssignmentValidator, validate, academicRelations("assignment"), createTeacherAssignment);
router.get("/", protect, authorize("Admin"), getAllTeacherAssignments);
router.get("/:id", protect, authorize("Admin"), getTeacherAssignmentById);
router.put("/:id", protect, authorize("Admin"), createTeacherAssignmentValidator, validate, academicRelations("assignment"), updateTeacherAssignment);
router.delete("/:id", protect, authorize("Admin"), deleteTeacherAssignment);

router.patch("/:id/restore", protect, authorize("Admin"), restoreAcademic("assignment"));
export default router;