import express from "express";
import { login } from "../controllers/auth/login.js";
import { logout } from "../controllers/auth/logout.js";
import { register } from "../controllers/auth/register.js";
import { getMe } from "../controllers/auth/me.js";
import { protect } from "../middleware/authMIddleware.js";

import { authorize } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { loginValidator, registerValidator } from "../validators/authValidator.js";
const router = express.Router();

router.post("/register", protect, authorize("Admin"), registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);


export default router;