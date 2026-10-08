import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createSection } from "../controllers/section/createSection.js";
import { getAllSections } from "../controllers/section/getAllSection.js";
import { getSectionById } from "../controllers/section/getSectionById.js";
import { updateSection } from "../controllers/section/updateSection.js";
import { deleteSection } from "../controllers/section/deleteSection.js";
import { createSectionValidator } from "../validators/sectionValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createSectionValidator, validate, createSection); 
router.get("/", protect, authorize("Admin", "Teacher"), getAllSections);
router.get("/:id", protect, authorize("Admin", "Teacher"), getSectionById);
router.put("/:id", protect, authorize("Admin"), createSectionValidator, validate, updateSection);
router.delete("/:id", protect, authorize("Admin"), deleteSection);

export default router;