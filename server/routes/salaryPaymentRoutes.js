import express from "express";

import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createSalaryPayment } from "../controllers/salaryPayment/createSalaryPayment.js";
import { getAllSalaryPayments } from "../controllers/salaryPayment/getAllSalaryPayments.js";
import { getSalaryPaymentById } from "../controllers/salaryPayment/getSalaryPaymentById.js";
import { deleteSalaryPayment } from "../controllers/salaryPayment/deleteSalaryPayment.js";
import { getTeacherPaymentHistory } from "../controllers/salaryPayment/getTeacherPaymentHistory.js";

import { createSalaryPaymentValidator } from "../validators/salaryPaymentValidator.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("Admin"),
    createSalaryPaymentValidator,
    validate,
    createSalaryPayment
);

router.get("/", protect, getAllSalaryPayments);

router.get("/:id", protect, getSalaryPaymentById);

router.get(
    "/teacher/:teacherSalaryId",
    protect,
    getTeacherPaymentHistory
);

router.delete(
    "/:id",
    protect,
    authorize("Admin"),
    deleteSalaryPayment
);

export default router;