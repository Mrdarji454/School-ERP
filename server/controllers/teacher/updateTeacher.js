import asyncHandler from "express-async-handler";
import { saveTeacher, setTeacherActive } from "../../services/teacherProfile.js";
export const updateTeacher = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await saveTeacher(req.params.id, req.body, req.user) }));