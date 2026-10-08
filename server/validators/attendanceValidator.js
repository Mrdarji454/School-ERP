import { body } from "express-validator";

export const createAttendanceValidator = [

    body("teacherAssignment")
        .notEmpty()
        .withMessage("Teacher Assignment is required"),

    body("attendanceDate")
        .isISO8601()
        .withMessage("Valid attendance date is required"),

    body("period")
        .isInt({ min: 1 })
        .withMessage("Period number is required"),

    body("students")
        .isArray({ min: 1 })
        .withMessage("Students array is required"),

];