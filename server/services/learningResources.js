import mongoose from 'mongoose';
import LearningResource from '../models/LearningResource.js';
import Subject from '../models/Subject.js';
import { schoolDate } from '../utils/schoolDate.js';
import { active, classSection, same } from '../utils/relationships.js';
import { audienceScope, eligibleAssignments } from './academicAccess.js';
import { storePdf, removeFile } from './privateStorage.js';
import { onlyFields } from './profileValidation.js';
import { fail } from '../utils/errors.js';
export const resourceTypes = ['Mock test', 'Study material', 'Answer key'];
const fields = ['title', 'description', 'type', 'academicYear', 'schoolClass', 'subject', 'sections', 'state', 'publishAt', 'expiresAt'];
const populate = query => query.populate('academicYear', 'name').populate('schoolClass', 'name').populate('subject', 'name code').populate('sections', 'name').populate('uploader', 'fullname role').populate('audit.actor', 'fullname role');
export const timestamp = (value, name, nullable = false) => {
  if (nullable && (value == null || value === '')) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || Number.isNaN(Date.parse(value))) fail(400, `${name} requires an ISO timestamp with timezone`);
  schoolDate(value.slice(0, 10)); return new Date(value);
};
export function validateResource(data) {
  onlyFields(data, [...fields, 'version', 'reason']);
  if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 200) fail(400, 'Title is required (maximum 200 characters)');
  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.length > 4000)) fail(400, 'Description must be at most 4000 characters');
  if (data.reason !== undefined && (typeof data.reason !== 'string' || data.reason.length > 500)) fail(400, 'Reason must be at most 500 characters');
  if (!resourceTypes.includes(data.type)) fail(400, 'Invalid resource type');
  for (const key of ['academicYear', 'schoolClass', 'subject']) if (!mongoose.isObjectIdOrHexString(data[key])) fail(400, `Invalid ${key}`);
  if (!Array.isArray(data.sections) || !data.sections.length || data.sections.length > 50 || data.sections.some(id => typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id)) || new Set(data.sections).size !== data.sections.length) fail(400, 'Choose 1–50 distinct target sections');
  if (!['draft', 'published', 'archived'].includes(data.state)) fail(400, 'Invalid publication state');
  const publishAt = timestamp(data.publishAt, 'Publication', data.state !== 'published'), expiresAt = timestamp(data.expiresAt, 'Expiry', true);
  if (expiresAt && (!publishAt || expiresAt <= publishAt)) fail(400, 'Expiry must be after publication');
  return { ...Object.fromEntries(fields.map(k => [k, data[k]])), title: data.title.trim(), description: data.description || '', publishAt, expiresAt };
}
export async function authorizeTargets(user, data) {
  const subject = await active(Subject, data.subject), cls = await classSection(data.schoolClass);
  if (!same(cls.academicYear, data.academicYear) || !same(subject.schoolClass, cls)) fail(400, 'Subject, class and academic year must agree');
  for (const section of data.sections) await classSection(data.schoolClass, section);
  if (user.role === 'Teacher') {
    const assignments = await eligibleAssignments(user);
    if (data.sections.some(section => !assignments.some(a => same(a.academicYear, data.academicYear) && same(a.subject, data.subject) && same(a.section, section)))) fail(403, 'Every target must be covered by your eligible teaching assignments');
  }
}
export async function resourceScope(user) {
  if (user.role === 'Admin') return {};
  if (user.role === 'Teacher') {
    // Reading/managing old resources also requires every target to remain eligible.
    const assignments = await eligibleAssignments(user);
    const groups = new Map();
    for (const a of assignments) { const key = `${a.academicYear}:${a.subject}`; if (!groups.has(key)) groups.set(key, { academicYear: a.academicYear, subject: a.subject, sections: [] }); groups.get(key).sections.push(a.section); }
    return { uploader: user._id, $or: [...groups.values()].map(g => ({ academicYear: g.academicYear, subject: g.subject, sections: { $not: { $elemMatch: { $nin: g.sections } } } })).concat([{ _id: null }]) };
  }
  const scope = await audienceScope(user), now = new Date();
  const subjects = await Subject.find({ schoolClass: { $in: scope.classes }, isActive: true }).distinct('_id');
  return { academicYear: { $in: scope.years }, schoolClass: { $in: scope.classes }, subject: { $in: subjects }, sections: { $in: scope.sections }, state: 'published', publishAt: { $lte: now }, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] };
}
function safe(row, user) {
  const result = row.toObject ? row.toObject() : row;
  result.file = { name: result.file.name, size: result.file.size, mime: 'application/pdf' };
  if (user.role === 'Student') { delete result.audit; delete result.__v; }
  return result;
}
export async function resourceDetail(user, id) {
  const row = await populate(LearningResource.findOne({ $and: [{ _id: id }, await resourceScope(user)] }));
  if (!row) fail(404, 'Resource not found or no longer eligible');
  return safe(row, user);
}
export async function resourceFile(user, id) {
  const row = await LearningResource.findOne({ $and: [{ _id: id }, await resourceScope(user), ...(user.role === 'Admin' ? [] : [{ state: { $ne: 'archived' } }, { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }])] });
  if (!row) fail(404, 'Resource file not available');
  return row.file;
}
export async function resourceList(user, query) {
  for (const value of Object.values(query)) if (typeof value !== 'string') fail(400, 'Invalid resource filter');
  const filters = [];
  for (const key of ['academicYear', 'schoolClass', 'subject', 'uploader']) if (query[key]) { if (!mongoose.isObjectIdOrHexString(query[key])) fail(400, `Invalid ${key}`); filters.push({ [key]: query[key] }); }
  if (query.section) { if (!mongoose.isObjectIdOrHexString(query.section)) fail(400, 'Invalid section'); filters.push({ sections: query.section }); }
  if (query.type) { if (!resourceTypes.includes(query.type)) fail(400, 'Invalid resource type'); filters.push({ type: query.type }); }
  if (query.state) { if (!['draft', 'published', 'archived'].includes(query.state)) fail(400, 'Invalid state'); filters.push({ state: query.state }); }
  if (query.search) filters.push({ title: { $regex: query.search.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
  const filter = { $and: [await resourceScope(user), ...filters] }, limit = Number(query.limit || 12), requested = Number(query.page || 1);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(requested) || requested < 1) fail(400, 'Invalid pagination');
  const total = await LearningResource.countDocuments(filter), totalPages = Math.max(1, Math.ceil(total / limit)), page = Math.min(requested, totalPages);
  const records = await populate(LearningResource.find(filter).sort({ createdAt: -1, _id: 1 }).skip((page - 1) * limit).limit(limit));
  return { records: records.map(r => safe(r, user)), pagination: { total, totalPages, page, limit } };
}
export async function createResource(user, input, file, internalId) {
  const data = validateResource(input);
  if (data.state === 'archived') fail(400, 'Create a draft or published resource before archiving');
  await authorizeTargets(user, data);
  const stored = await storePdf(file);
  let row;
  try { row = await LearningResource.create({ ...(internalId ? { _id: internalId } : {}), ...data, uploader: user._id, file: stored, audit: [{ action: 'created', actor: user._id, reason: data.state }] }); }
  catch (error) { await removeFile(stored.key); throw error; }
  return resourceDetail(user, row._id);
}
export async function updateResource(user, id, input) {
  if (!Number.isSafeInteger(input.version) || input.version < 0) fail(428, 'The loaded resource version is required');
  const row = await LearningResource.findOne({ $and: [{ _id: id }, await resourceScope(user)] });
  if (!row) fail(404, 'Resource not found or no longer eligible');
  if (row.state === 'archived' && user.role !== 'Admin') fail(403, 'Only Admin can restore an archived resource');
  const data = validateResource(input);
  if (row.state === 'archived' && data.state === 'published') fail(400, 'Restore an archived resource to draft before publishing');
  if (data.state === 'archived' && (typeof input.reason !== 'string' || !input.reason.trim() || input.reason.length > 500)) fail(400, 'Archiving requires a reason (maximum 500 characters)');
  if (data.state !== 'archived') await authorizeTargets(user, data);
  else if (['academicYear', 'schoolClass', 'subject'].some(key => !same(row[key], data[key])) || row.sections.map(String).sort().join() !== data.sections.slice().sort().join()) fail(400, 'Academic targets cannot change while archiving');
  // Files are immutable: upload a new resource instead of replacing published bytes.
  const result = await LearningResource.findOneAndUpdate({ _id: row._id, __v: input.version }, { $set: data, $inc: { __v: 1 }, $push: { audit: { action: row.state === data.state ? 'metadata edited' : `${row.state} -> ${data.state}`, actor: user._id, at: new Date(), reason: input.reason || '' } } }, { new: true, runValidators: true });
  if (!result) fail(409, 'Resource changed. Reload before saving');
  return resourceDetail(user, id);
}
