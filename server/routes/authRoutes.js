import express from "express";
import asyncHandler from 'express-async-handler';
import { changePassword, resetPassword, myProfile, updateMyProfile, changeEmail, adminChangeEmail } from '../services/account.js';
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
const reply = fn => asyncHandler(async (req, res) => res.json({ success: true, data: await fn(req) }));
router.post('/password', protect, reply(req => changePassword(req.user, req.body)));
router.post('/accounts/:id/reset-password', protect, authorize('Admin'), reply(req => resetPassword(req.user, req.params.id, req.body)));
router.post('/accounts/:id/email', protect, authorize('Admin'), reply(req => adminChangeEmail(req.user, req.params.id, req.body)));
router.get('/profile', protect, authorize('Student', 'Teacher'), reply(req => myProfile(req.user)));
router.patch('/profile', protect, authorize('Student', 'Teacher'), reply(req => updateMyProfile(req.user, req.body)));
router.post('/email', protect, authorize('Student', 'Teacher'), reply(req => changeEmail(req.user, req.body)));


export default router;
