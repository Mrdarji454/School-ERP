import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import { studentFilter, createProfile, updateProfile } from './student/studentCore.js';
import { saveTeacher } from './teacherProfile.js';
import { fail } from '../utils/errors.js';
export const peopleModel = kind => kind === 'students' ? Student : kind === 'teachers' ? Teacher : fail(404, 'Unknown profile type');
export const identifier = kind => kind === 'students' ? 'admissionNo' : 'employeeId';
export async function peopleFilter(kind, query) {
  peopleModel(kind);
  for (const value of Object.values(query)) if (typeof value !== 'string') fail(400, 'Invalid filter');
  if (query.status && !['active', 'inactive', 'all'].includes(query.status)) fail(400, 'Invalid status');
  for (const key of ['academicYear', 'schoolClass', 'section']) if (query[key] && !mongoose.isObjectIdOrHexString(query[key])) fail(400, `Invalid ${key}`);
  let filter;
  if (kind === 'students') filter = await studentFilter({ ...query, status: !query.status || query.status === 'all' ? '' : String(query.status === 'active') });
  else {
    filter = {};
    if (query.status && query.status !== 'all') filter.isActive = query.status === 'active';
    for (const key of ['employeeId', 'department', 'designation', 'employeeType']) if (query[key]) filter[key] = query[key];
    if (query.search) {
      const regex = { $regex: query.search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      filter.user = { $in: await User.find({ role: 'Teacher', $or: [{ fullname: regex }, { email: regex }] }).distinct('_id') };
    }
    const scope = Object.fromEntries(['academicYear', 'schoolClass', 'section'].filter(k => query[k]).map(k => [k, query[k]]));
    if (Object.keys(scope).length) filter._id = { $in: await TeacherAssignment.find({ ...scope, isActive: true }).distinct('teacher') };
  }
  if (query.selected) {
    const ids = query.selected.split(',');
    if (ids.length > 1000 || ids.some(id => !id || id.length > 100)) fail(400, 'Invalid selected identifiers');
    filter.$and = [...(filter.$and || []), { [identifier(kind)]: { $in: ids } }];
  }
  return filter;
}
export function populatePeople(kind, query) {
  query = query.select('-salary -photo').populate('user', 'fullname email phone isActive mustChangePassword');
  return kind === 'students' ? query.populate({ path: 'schoolClass', select: 'name academicYear isActive', populate: { path: 'academicYear', select: 'name isActive' } }).populate('section', 'name isActive') : query;
}
export async function listPeople(kind, query, all = false) {
  const Model = peopleModel(kind), filter = await peopleFilter(kind, query);
  const total = await Model.countDocuments(filter);
  const limit = Number(query.limit || 20), requested = Number(query.page || 1);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(requested) || requested < 1) fail(400, 'Invalid pagination');
  const totalPages = Math.max(1, Math.ceil(total / limit)), page = Math.min(requested, totalPages);
  const sortKey = query.sort || identifier(kind);
  if (![identifier(kind), 'createdAt', ...(kind === 'students' ? ['rollNumber'] : ['department', 'designation'])].includes(sortKey)) fail(400, 'Invalid sort');
  let cursor = Model.find(filter).sort({ [sortKey]: 1, _id: 1 });
  if (!all) cursor = cursor.skip((page - 1) * limit).limit(limit);
  const records = await populatePeople(kind, cursor).lean();
  if (query.selected && records.length !== new Set(query.selected.split(',')).size && all) fail(400, 'Selected records must all match the current filters');
  const active = await Model.countDocuments({ $and: [filter, { isActive: true }] });
  return { records, pagination: { total, page, limit, totalPages }, statistics: { total, active, inactive: total - active } };
}
export const savePerson = (kind, id, data, actor) => kind === 'students' ? id ? updateProfile(id, data) : createProfile(data, actor) : saveTeacher(id, data, actor);
