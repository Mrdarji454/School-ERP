import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createClass } from "../controllers/class/createClass.js";
import { getAllClasses } from "../controllers/class/getAllClass.js";
import { getClassById } from "../controllers/class/getClassById.js";
import { updateClass } from "../controllers/class/updateClass.js";
import { deleteClass } from "../controllers/class/deleteClass.js";
import { createClassValidator } from "../validators/classValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createClassValidator, validate, createClass);
router.get("/", protect, authorize("Admin", "Teacher"), getAllClasses);
router.get("/:id", protect, authorize("Admin", "Teacher"), getClassById);
router.put("/:id", protect, authorize("Admin"), validate, updateClass);
router.delete("/:id", protect, authorize("Admin"), deleteClass);

export default router;