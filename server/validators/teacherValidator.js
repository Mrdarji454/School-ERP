import { body } from "express-validator";

export const createTeacherValidator = [

    body("fullname")
        .trim()
        .notEmpty()
        .withMessage("Full name is required"),

    body("email")
        .isEmail()
        .withMessage("Valid email is required"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("qualification")
        .notEmpty()
        .withMessage("Qualification is required"),

    body("designation")
        .notEmpty()
        .withMessage("Designation is required"),

    body("joiningDate")
        .isISO8601()
        .withMessage("Valid joining date is required"),

];