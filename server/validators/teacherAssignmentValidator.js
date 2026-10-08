import { body } from "express-validator";

export const createTeacherAssignmentValidator = [

    body("teacher")
        .notEmpty()
        .withMessage("Teacher is required"),

    body("subject")
        .notEmpty()
        .withMessage("Subject is required"),

    body("schoolClass")
        .notEmpty()
        .withMessage("School Class is required"),

    body("section")
        .notEmpty()
        .withMessage("Section is required"),

    body("academicYear")
        .notEmpty()
        .withMessage("Academic Year is required"),
];