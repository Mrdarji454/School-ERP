import asyncHandler from "express-async-handler";
import { saveTeacher, setTeacherActive } from "../../services/teacherProfile.js";
export const createTeacher = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await saveTeacher(null, req.body, req.user) }));