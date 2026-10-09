import { academicRelations, restoreAcademic } from "../middleware/academicRelations.js";
import express from "express";

import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createSection } from "../controllers/section/createSection.js";
import { getAllSections } from "../controllers/section/getAllSection.js";
import { getSectionById } from "../controllers/section/getSectionById.js";
import { updateSection } from "../controllers/section/updateSection.js";
import { deleteSection } from "../controllers/section/deleteSection.js";
import { createSectionValidator } from "../validators/sectionValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createSectionValidator, validate, academicRelations("section"), createSection);
router.get("/", protect, authorize("Admin", "Teacher"), getAllSections);
router.get("/:id", protect, authorize("Admin", "Teacher"), getSectionById);
router.put("/:id", protect, authorize("Admin"), createSectionValidator, validate, academicRelations("section"), updateSection);
router.delete("/:id", protect, authorize("Admin"), deleteSection);

router.patch("/:id/restore", protect, authorize("Admin"), restoreAcademic("section"));
export default router;
