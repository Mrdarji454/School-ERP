import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import {
    createStudentFee,
} from "../controllers/studentFee/createStudentFee.js";

import {
    getAllStudentFees,
} from "../controllers/studentFee/getAllStudentFees.js";

import {
    getStudentFeeById,
} from "../controllers/studentFee/getStudentFeeById.js";

import {
    updateStudentFee,
} from "../controllers/studentFee/updateStudentFee.js";

import {
    deleteStudentFee,
} from "../controllers/studentFee/deleteStudentFee.js";

import {
    restoreStudentFee,
} from "../controllers/studentFee/restoreStudentFee.js";

import { createStudentFeeValidator } from "../validators/studentFeeValidator.js";

const router = express.Router();

router.post("/", protect, authorize("Admin"), createStudentFeeValidator, validate, createStudentFee);

router.get("/", protect, getAllStudentFees);

router.get("/:id", protect, getStudentFeeById);

router.put("/:id", protect, authorize("Admin"), updateStudentFee);

router.delete("/:id", protect, authorize("Admin"), deleteStudentFee);

router.patch("/:id/restore", protect, authorize("Admin"), restoreStudentFee);

export default router;