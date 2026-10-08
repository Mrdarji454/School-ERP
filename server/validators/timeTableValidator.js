import { body } from "express-validator";

export const createTimetableValidator = [

    body("academicYear")
        .notEmpty()
        .withMessage("Academic Year is required"),

    body("teacherAssignment")
        .notEmpty()
        .withMessage("Teacher Assignment is required"),

    body("day")
        .notEmpty()
        .withMessage("Day is required"),
    body("period")
        .notEmpty()
        .withMessage("Period is required"),
];