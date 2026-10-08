import { body } from "express-validator";

export const generateTeacherSalaryValidator = [

    body("teacher")
        .notEmpty()
        .withMessage("Teacher is required"),

    body("month")
        .isInt({ min: 1, max: 12 })
        .withMessage("Invalid month"),

    body("year")
        .isInt({ min: 2020 })
        .withMessage("Invalid year"),

];