import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createSubject } from "../controllers/subject/createSubject.js";
import { getAllSubjects } from "../controllers/subject/getAllSubjects.js";
import { getSubjectById } from "../controllers/subject/getSubjectById.js";
import { updateSubject } from "../controllers/subject/updateSubject.js";
import { deleteSubject } from "../controllers/subject/deleteSubject.js";

import { createSubjectValidator } from "../validators/subjectValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createSubjectValidator, validate, createSubject);
router.get("/", protect, authorize("Admin", "Teacher"), getAllSubjects);
router.get("/:id", protect, authorize("Admin", "Teacher"), getSubjectById);
router.put("/:id", protect, authorize("Admin"), createSubjectValidator, validate, updateSubject);
router.delete("/:id", protect, authorize("Admin"), deleteSubject);

export default router;