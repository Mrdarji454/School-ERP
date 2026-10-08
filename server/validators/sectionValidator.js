import { body } from "express-validator";

export const createSectionValidator = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Section name is required"),

    body("schoolClass")
        .notEmpty()
        .withMessage("School Class is required"),

    body("capacity")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Capacity must be greater than 0"),
];