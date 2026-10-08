import { body } from "express-validator";

export const createNotificationValidator = [

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required"),

    body("message")
        .trim()
        .notEmpty()
        .withMessage("Message is required"),

    body("type")
        .isIn([
            "General",
            "Holiday",
            "Event",
            "Exam",
            "Emergency",
            "Notice",
        ])
        .withMessage("Invalid notification type"),

    body("priority")
        .isIn([
            "Low",
            "Medium",
            "High",
            "Urgent",
        ])
        .withMessage("Invalid priority"),

    body("publishDate")
        .isISO8601()
        .withMessage("Valid publish date is required"),
];