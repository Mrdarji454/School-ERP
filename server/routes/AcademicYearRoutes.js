import { academicRelations, restoreAcademic } from "../middleware/academicRelations.js";
import express from "express";
import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createAcademicYear } from "../controllers/AcademicYear/createAcademicYear.js";
import { createAcademicYearValidator } from "../validators/AcadamicYearValidator.js";
import { getAllAcademicYear } from "../controllers/AcademicYear/getAllAcademicYear.js";
import { getAcademicYearById } from "../controllers/AcademicYear/getAcademicYearById.js";
import { upadateAcademicYear } from "../controllers/AcademicYear/updateAcademicYear.js";
import { deleteAcademicYear, restoreAcademicYear } from "../controllers/AcademicYear/softDeleteAcademicYear.js";
import { setCurrentAcademicYear } from "../controllers/AcademicYear/setCurrentAcademicYear.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createAcademicYearValidator, validate, academicRelations("year"), createAcademicYear);
router.get("/", protect, authorize("Admin", "Teacher"), getAllAcademicYear);
router.get("/:id", protect, authorize("Admin", "Teacher"), getAcademicYearById);
router.put("/:id", protect, authorize("Admin"), createAcademicYearValidator, validate, academicRelations("year"), upadateAcademicYear);
router.delete("/:id", protect, authorize("Admin"), deleteAcademicYear);
router.patch("/:id", protect, authorize("Admin"), restoreAcademicYear);
router.patch("/:id/current", protect, authorize("Admin"), setCurrentAcademicYear);
export default router;