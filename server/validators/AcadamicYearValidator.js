import { body } from "express-validator";

export const createAcademicYearValidator = [
    body("name").notEmpty().withMessage("Acadamic year name is required"),
    body("startDate").isISO8601().withMessage("start date of acadamic year is required"),
    body("endDate").isISO8601().withMessage("end date of acadamic year is required"),
]