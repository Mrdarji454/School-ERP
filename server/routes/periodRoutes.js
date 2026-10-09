import { academicRelations, restoreAcademic } from "../middleware/academicRelations.js";
import express from "express";

import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createPeriod } from "../controllers/period/createPeriod.js";
import { getAllPeriods } from "../controllers/period/getAllPeriods.js";
import { getPeriodById } from "../controllers/period/getPeriodById.js";
import { updatePeriod } from "../controllers/period/updatePeriod.js";
import { deletePeriod } from "../controllers/period/deletePeriod.js";
import { restorePeriod } from "../controllers/period/restorePeriod.js";

import { createPeriodValidator } from "../validators/periodValidator.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("Admin"),
    createPeriodValidator,
    validate, academicRelations("period"), createPeriod
);

router.get(
    "/",
    protect,
    getAllPeriods
);

router.get(
    "/:id",
    protect,
    getPeriodById
);

router.put(
    "/:id",
    protect,
    authorize("Admin"),
    createPeriodValidator,
    validate, academicRelations("period"), updatePeriod
);

router.delete(
    "/:id",
    protect,
    authorize("Admin"),
    deletePeriod
);

router.patch(
    "/:id/restore",
    protect,
    authorize("Admin"),
    restorePeriod
);

export default router;