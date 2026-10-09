import { randomUUID } from "node:crypto";
import User from "../models/User.js";
import Teacher from "../models/Teacher.js";
import { transaction } from "../utils/transaction.js";
import { fail } from "../utils/errors.js";
const fields = ["qualification", "experience", "designation", "joiningDate", "salary", "address", "employeeType", "department", "photo"];
export async function saveTeacher(id, body, actor) {
  const savedId = await transaction(async session => {
    const teacher = id ? await Teacher.findById(id).session(session) : new Teacher({ employeeId: `TCH-${randomUUID()}`, createdBy: actor._id });
    if (!teacher) fail(404, "Teacher not found");
    const user = id ? await User.findById(teacher.user).session(session) : new User({ role: "Teacher" });
    if (!user) fail(404, "Teacher account not found");
    for (const key of ["fullname", "email", "phone"]) if (body[key] !== undefined) user[key] = body[key];
    if (body.password) user.password = body.password;
    for (const key of fields) if (body[key] !== undefined) teacher[key] = body[key];
    teacher.user = user._id; teacher.updatedBy = actor._id;
    await user.save({ session }); await teacher.save({ session }); return teacher._id;
  });
  return Teacher.findById(savedId).populate("user", "fullname email phone isActive");
}
export async function setTeacherActive(id, isActive) {
  return transaction(async session => {
    const teacher = await Teacher.findById(id).session(session);
    if (!teacher) fail(404, "Teacher not found");
    teacher.isActive = isActive; await teacher.save({ session });
    const user = await User.findByIdAndUpdate(teacher.user, { $set: { isActive } }, { session });
    if (!user) fail(404, "Teacher account not found");
    return teacher;
  });
}
