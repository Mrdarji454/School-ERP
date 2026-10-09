import { body } from "express-validator";

export const createPeriodValidator = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Period name is required"),

    body("periodNumber")
        .isInt({ min: 1 })
        .withMessage("Valid period number is required"),

    body("startTime")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("Start time must be in HH:mm format"),

    body("endTime")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("End time must be in HH:mm format"),

];