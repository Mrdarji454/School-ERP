import { body } from "express-validator";

export const createAcademicCalendarValidator = [

    body("academicYear")
        .notEmpty()
        .withMessage("Academic Year is required"),

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required"),

    body("type")
        .isIn([
            "Holiday",
            "Working Day",
            "Half Day",
            "Vacation",
            "Event",
            "Exam"
        ])
        .withMessage("Invalid calendar type"),

    body("startDate")
        .isISO8601()
        .withMessage("Valid start date is required"),

    body("endDate")
        .isISO8601()
        .withMessage("Valid end date is required"),
];