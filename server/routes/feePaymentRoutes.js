import express from "express";

import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createFeePayment } from "../controllers/feePayment/createFeePayment.js";
import { getAllFeePayments } from "../controllers/feePayment/getAllFeePayments.js";
import { getFeePaymentById } from "../controllers/feePayment/getFeePaymentById.js";
import { deleteFeePayment } from "../controllers/feePayment/deleteFeePayment.js";
import { getStudentPaymentHistory } from "../controllers/feePayment/getStudentPaymentHistory.js";

import { createFeePaymentValidator } from "../validators/feePaymentValidator.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("Admin"),
    createFeePaymentValidator,
    validate,
    createFeePayment
);

router.get("/", protect, getAllFeePayments);

router.get("/:id", protect, getFeePaymentById);

router.get(
    "/student/:studentFeeId",
    protect,
    getStudentPaymentHistory
);

router.delete(
    "/:id",
    protect,
    authorize("Admin"),
    deleteFeePayment
);

export default router;