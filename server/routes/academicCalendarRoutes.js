import express from "express";

import { protect } from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createAcademicCalendar } from "../controllers/academicCalendar/createAcademicCalendar.js";
import { getAllAcademicCalendars } from "../controllers/academicCalendar/getAllAcademicCalendars.js";
import { getAcademicCalendarById } from "../controllers/academicCalendar/getAcademicCalendarById.js";
import { updateAcademicCalendar } from "../controllers/academicCalendar/updateAcademicCalendar.js";
import { deleteAcademicCalendar } from "../controllers/academicCalendar/deleteAcademicCalendar.js";
import { restoreAcademicCalendar } from "../controllers/academicCalendar/restoreAcademicCalendar.js";

import { createAcademicCalendarValidator } from "../validators/academicCalendarValidator.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("Admin"),
    createAcademicCalendarValidator,
    validate,
    createAcademicCalendar
);

router.get(
    "/",
    protect,
    getAllAcademicCalendars
);

router.get(
    "/:id",
    protect,
    getAcademicCalendarById
);

router.put(
    "/:id",
    protect,
    authorize("Admin"),
    createAcademicCalendarValidator,
    validate,
    updateAcademicCalendar
);

router.delete(
    "/:id",
    protect,
    authorize("Admin"),
    deleteAcademicCalendar
);

router.patch(
    "/:id/restore",
    protect,
    authorize("Admin"),
    restoreAcademicCalendar
);

export default router;