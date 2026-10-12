import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import AcademicCalendar from '../models/AcademicCalendar.js';
import AcademicYear from '../models/AcademicYear.js';
import Section from '../models/Section.js';
import { audienceScope } from './academicAccess.js';
import { classSection, active } from '../utils/relationships.js';
import { onlyFields } from './profileValidation.js';
import { schoolDate } from '../utils/schoolDate.js';
import { fail } from '../utils/errors.js';
export const noticeFields = 'title message type priority publishDate expiryDate audience targetClasses targetSections isActive createdAt updatedAt __v';
export const calendarFields = 'academicYear title description type startDate endDate isActive createdAt updatedAt __v';
export const calendarTypes = ['Holiday', 'Working Day', 'Half Day', 'Vacation', 'Event', 'Exam'];
const escaped = text => text.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export async function noticeScope(user, publishedOnly = false, now = new Date()) {
  const time = { isActive: true, publishDate: { $lte: now }, $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }] };
  if (user.role === 'Admin') return publishedOnly ? time : {};
  const scope = await audienceScope(user);
  return { $and: [time, { $or: [{ audience: 'Everyone' }, { audience: { $exists: false } }, { audience: user.role === 'Teacher' ? 'Teachers' : 'Students' }, { audience: 'Selected', $or: [{ targetClasses: { $in: scope.classes } }, { targetSections: { $in: scope.sections } }] }] }] };
}
export async function calendarScope(user) {
  if (user.role === 'Admin') return {};
  return { isActive: true, academicYear: { $in: (await audienceScope(user)).years } };
}
export async function listCommunications(kind, user, query = {}, publishedOnly = false) {
  const notice = kind === 'notices', Model = notice ? Notification : AcademicCalendar;
  for (const value of Object.values(query)) if (typeof value !== 'string') fail(400, 'Invalid communication filter');
  const filters = [notice ? await noticeScope(user, publishedOnly) : await calendarScope(user)];
  if (query.search) filters.push({ title: { $regex: escaped(query.search), $options: 'i' } });
  if (query.type) filters.push({ type: query.type });
  if (query.academicYear && !notice) { if (!mongoose.isObjectIdOrHexString(query.academicYear)) fail(400, 'Invalid academic year'); filters.push({ academicYear: query.academicYear }); }
  if (query.audience && notice) { if (!['Everyone', 'Teachers', 'Students', 'Selected'].includes(query.audience)) fail(400, 'Invalid audience'); filters.push({ audience: query.audience }); }
  if (user.role === 'Admin' && query.status && query.status !== 'all') {
    const now = new Date();
    if (query.status === 'inactive') filters.push({ isActive: false });
    else if (query.status === 'active') filters.push({ isActive: true });
    else if (notice && query.status === 'scheduled') filters.push({ isActive: true, publishDate: { $gt: now } });
    else if (notice && query.status === 'expired') filters.push({ isActive: true, expiryDate: { $lte: now } });
    else if (notice && query.status === 'published') filters.push(await noticeScope(user, true));
    else fail(400, 'Invalid status filter');
  }
  if (!notice && (query.from || query.to)) {
    const from = query.from ? schoolDate(query.from) : null, to = query.to ? schoolDate(query.to) : null;
    if (from && to && from > to) fail(400, 'End date must follow start date');
    if (from) filters.push({ endDate: { $gte: from } }); if (to) filters.push({ startDate: { $lte: to } });
  }
  const limit = Number(query.limit || 20), requested = Number(query.page || 1);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(requested) || requested < 1) fail(400, 'Invalid pagination');
  const filter = { $and: filters }, total = await Model.countDocuments(filter), totalPages = Math.max(1, Math.ceil(total / limit)), page = Math.min(requested, totalPages);
  let cursor = Model.find(filter).select(notice ? noticeFields : calendarFields).sort(notice ? { publishDate: -1, _id: 1 } : { startDate: 1, _id: 1 }).skip((page - 1) * limit).limit(limit);
  if (!notice) cursor = cursor.populate('academicYear', 'name');
  return { records: await cursor.lean(), pagination: { page, total, totalPages, limit } };
}
export async function communicationDetail(kind, user, id) {
  const notice = kind === 'notices', Model = notice ? Notification : AcademicCalendar;
  let query = Model.findOne({ $and: [{ _id: id }, notice ? await noticeScope(user) : await calendarScope(user)] }).select(notice ? noticeFields : calendarFields);
  if (!notice) query = query.populate('academicYear', 'name');
  const row = await query;
  if (!row) fail(404, 'Entry not found or not available');
  return row;
}
const stamp = (value, name, optional = false) => {
  if (optional && (value == null || value === '')) return null;
  // Preserve legacy date-only notice inputs as UTC midnight; new UI submits explicit timezone-aware instants.
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || (!/^\d{4}-\d{2}-\d{2}$/.test(value) && !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value))) fail(400, `Invalid ${name}`);
  schoolDate(value.slice(0, 10)); return new Date(value);
};
export async function saveCommunication(kind, user, id, input, internalId) {
  const notice = kind === 'notices', Model = notice ? Notification : AcademicCalendar;
  const allowed = notice ? ['title', 'message', 'type', 'priority', 'publishDate', 'expiryDate', 'audience', 'targetClasses', 'targetSections', 'isActive'] : ['title', 'description', 'type', 'academicYear', 'startDate', 'endDate', 'isActive'];
  onlyFields(input, [...allowed, 'version']);
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 200) fail(400, 'Title is required (maximum 200 characters)');
  const data = Object.fromEntries(allowed.filter(k => input[k] !== undefined).map(k => [k, input[k]]));
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') fail(400, 'Invalid active status');
  if (notice) {
    if (typeof data.message !== 'string' || !data.message.trim() || data.message.length > 5000) fail(400, 'Message is required (maximum 5000 characters)');
    data.publishDate = stamp(data.publishDate, 'publication'); data.expiryDate = stamp(data.expiryDate, 'expiry', true);
    if (data.expiryDate && data.expiryDate <= data.publishDate) fail(400, 'Expiry must follow publication');
    data.audience ||= 'Everyone'; data.targetClasses ||= []; data.targetSections ||= [];
    if (!['Everyone', 'Teachers', 'Students', 'Selected'].includes(data.audience)) fail(400, 'Invalid audience');
    for (const key of ['targetClasses', 'targetSections']) if (!Array.isArray(data[key]) || data[key].length > 50 || data[key].some(v => typeof v !== 'string' || !mongoose.isObjectIdOrHexString(v)) || new Set(data[key]).size !== data[key].length) fail(400, 'Invalid audience targets');
    if (data.audience === 'Selected') {
      if (!data.targetClasses.length && !data.targetSections.length) fail(400, 'Select at least one audience class or section');
      for (const cls of data.targetClasses) await classSection(cls);
      for (const id of data.targetSections) { const section = await active(Section, id); await classSection(section.schoolClass, id); }
    } else if (data.targetClasses.length || data.targetSections.length) fail(400, 'Academic targets require Selected audience');
  } else {
    if (!mongoose.isObjectIdOrHexString(data.academicYear)) fail(400, 'Choose an academic year');
    const year = await active(AcademicYear, data.academicYear);
    if (!calendarTypes.includes(data.type)) fail(400, 'Invalid calendar event type');
    if (data.description !== undefined && (typeof data.description !== 'string' || data.description.length > 5000)) fail(400, 'Description must be at most 5000 characters');
    data.startDate = schoolDate(data.startDate); data.endDate = schoolDate(data.endDate);
    if (data.endDate < data.startDate || data.startDate < year.startDate || data.endDate > year.endDate) fail(400, 'Event dates must be ordered and inside the academic year');
  }
  if (!id) return Model.create({ ...(internalId ? { _id: internalId } : {}), ...data, createdBy: user._id });
  if (input.version !== undefined && (!Number.isSafeInteger(input.version) || input.version < 0)) fail(400, 'Invalid version');
  const row = await Model.findOneAndUpdate({ _id: id, ...(input.version !== undefined ? { __v: input.version } : {}) }, { $set: { ...data, updatedBy: user._id }, $inc: { __v: 1 } }, { new: true, runValidators: true });
  if (!row) fail(409, 'Entry missing or changed; reload before saving');
  return row;
}
export async function setCommunicationActive(kind, user, id, isActive) {
  const Model = kind === 'notices' ? Notification : AcademicCalendar;
  const row = await Model.findByIdAndUpdate(id, { $set: { isActive, updatedBy: user._id }, $inc: { __v: 1 } }, { new: true });
  if (!row) fail(404, 'Entry not found'); return row;
}
