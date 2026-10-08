import express from "express";
import protect from "../middleware/authMIddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/admin", protect, authorize(["Admin"]), (req, res) => {
    res.json({
        message: "Welcome Admin"
    });
});

export default router;
