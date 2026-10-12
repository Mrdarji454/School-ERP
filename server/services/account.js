import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import { transaction } from '../utils/transaction.js';
import { fail } from '../utils/errors.js';
import { password, onlyFields, profileValues } from './profileValidation.js';
import generateToken from '../utils/generateToken.js';
export async function changePassword(actor, data) {
  onlyFields(data, ['currentPassword', 'newPassword']); password(data.newPassword);
  const user = await transaction(async session => {
    const row = await User.findById(actor._id).select('+password +tokenVersion').session(session);
    if (typeof data.currentPassword !== 'string' || !await row.comparePassword(data.currentPassword)) fail(400, 'Current password is incorrect');
    if (await row.comparePassword(data.newPassword)) fail(400, 'Choose a different password');
    row.password = data.newPassword; row.mustChangePassword = false; row.passwordChangedAt = new Date(); row.tokenVersion = (row.tokenVersion || 0) + 1;
    await row.save({ session }); return row;
  });
  return { user, token: generateToken(user._id, user.role, user.tokenVersion) };
}
export async function resetPassword(actor, id, data) {
  onlyFields(data, ['password', 'reason']); password(data.password);
  if (typeof data.reason !== 'string' || !data.reason.trim() || data.reason.length > 500) fail(400, 'A reset reason is required (maximum 500 characters)');
  await transaction(async session => {
    const user = await User.findById(id).select('+tokenVersion').session(session);
    if (!user || !['Student', 'Teacher'].includes(user.role)) fail(404, 'Student or Teacher account not found');
    user.password = data.password; user.mustChangePassword = true; user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.passwordResetAt = new Date(); user.passwordResetBy = actor._id; user.passwordResetReason = data.reason.trim(); await user.save({ session });
  });
  return { reset: true };
}
export async function myProfile(actor) {
  const student = actor.role === 'Student';
  const Model = student ? Student : Teacher;
  let query = Model.findOne({ user: actor._id }).select('-salary -photo').populate('user', 'fullname email phone isActive');
  if (student) query = query.populate({ path: 'schoolClass', select: 'name academicYear', populate: { path: 'academicYear', select: 'name' } }).populate('section', 'name');
  const profile = await query;
  if (!profile) fail(404, 'Profile not found');
  const assignments = student ? [] : await TeacherAssignment.find({ teacher: profile._id }).populate('schoolClass', 'name').populate('section', 'name').populate('subject', 'name').select('schoolClass section subject isActive');
  return { profile, assignments };
}
export async function updateMyProfile(actor, data) {
  const allowed = actor.role === 'Student' ? ['phone', 'address', 'bloodGroup', 'guardianPhone', 'additionalGuardianPhone'] : ['phone', 'address', 'emergencyContact'];
  onlyFields(data, allowed); profileValues(data);
  await transaction(async session => {
    const Model = actor.role === 'Student' ? Student : Teacher;
    const row = await Model.findOne({ user: actor._id }).session(session);
    if (!row) fail(404, 'Profile not found');
    for (const key of allowed) if (data[key] !== undefined && (key !== 'phone' || actor.role === 'Student')) row[key] = data[key];
    if (data.phone !== undefined) await User.updateOne({ _id: actor._id }, { $set: { phone: data.phone } }, { session });
    await row.save({ session });
  });
  return myProfile(actor);
}
export async function changeEmail(actor, data) {
  onlyFields(data, ['email', 'currentPassword']); profileValues({ email: data.email });
  await transaction(async session => {
    const row = await User.findById(actor._id).select('+password').session(session);
    if (typeof data.currentPassword !== 'string' || !await row.comparePassword(data.currentPassword)) fail(400, 'Current password is incorrect');
    row.email = data.email; row.emailChangedAt = new Date(); row.emailChangedBy = actor._id; await row.save({ session });
  });
  return User.findById(actor._id);
}
export async function adminChangeEmail(actor, id, data) {
  onlyFields(data, ['email']); profileValues(data);
  const user = await User.findById(id);
  if (!user || !['Student', 'Teacher'].includes(user.role)) fail(404, 'Student or Teacher account not found');
  user.email = data.email; user.emailChangedAt = new Date(); user.emailChangedBy = actor._id; await user.save();
  return { changed: true };
}
