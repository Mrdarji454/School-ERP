import asyncHandler from "express-async-handler";
import { saveTeacher, setTeacherActive } from "../../services/teacherProfile.js";
export const deleteTeacher = asyncHandler(async (req, res) => res.status(200).json({ success: true, data: await setTeacherActive(req.params.id, false) }));