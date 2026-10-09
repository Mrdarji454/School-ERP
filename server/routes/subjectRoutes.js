import { academicRelations, restoreAcademic } from "../middleware/academicRelations.js";
import express from "express";

import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createSubject } from "../controllers/subject/createSubject.js";
import { getAllSubjects } from "../controllers/subject/getAllSubjects.js";
import { getSubjectById } from "../controllers/subject/getSubjectById.js";
import { updateSubject } from "../controllers/subject/updateSubject.js";
import { deleteSubject } from "../controllers/subject/deleteSubject.js";

import { createSubjectValidator } from "../validators/subjectValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createSubjectValidator, validate, academicRelations("subject"), createSubject);
router.get("/", protect, authorize("Admin", "Teacher"), getAllSubjects);
router.get("/:id", protect, authorize("Admin", "Teacher"), getSubjectById);
router.put("/:id", protect, authorize("Admin"), createSubjectValidator, validate, academicRelations("subject"), updateSubject);
router.delete("/:id", protect, authorize("Admin"), deleteSubject);

router.patch("/:id/restore", protect, authorize("Admin"), restoreAcademic("subject"));
export default router;