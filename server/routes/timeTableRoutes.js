import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";

import { createTimetable } from "../controllers/timetable/createTimetable.js";

import { createTimetableValidator } from "../validators/timetableValidator.js";

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("Admin"),
    createTimetableValidator,
    validate,
    createTimetable
);


export default router;