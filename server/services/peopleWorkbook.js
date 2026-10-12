import ExcelJS from 'exceljs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import AcademicYear from '../models/AcademicYear.js';
import SchoolClass from '../models/SchoolClass.js';
import Section from '../models/Section.js';
import User from '../models/User.js';
import { studentFields, validateStudent } from './student/studentCore.js';
import { teacherFields } from './teacherProfile.js';
import { password, profileValues } from './profileValidation.js';
import { peopleModel, identifier, listPeople, savePerson } from './people.js';
import { fail } from '../utils/errors.js';
export const workbookColumns = kind => [identifier(kind), 'fullname', 'email', 'password', 'accountActive', 'isActive', ...(kind === 'students' ? ['academicYear', 'className', 'sectionName', ...studentFields.filter(k => !['schoolClass', 'section'].includes(k))] : ['phone', ...teacherFields])];
const safeCell = v => typeof v === 'string' && /^\s*[=+@-]/.test(v) ? `'${v}` : v;
export function profileTemplate(kind) {
  peopleModel(kind);
  const book = new ExcelJS.Workbook(), sheet = book.addWorksheet(kind);
  sheet.columns = workbookColumns(kind).map(key => ({ header: key, key, width: 24 }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow({ fullname: `Example ${kind === 'students' ? 'Student' : 'Teacher'}`, email: 'replace@example.test', password: 'ReplaceBeforeImport!', accountActive: 'true', isActive: 'true', ...(kind === 'students' ? { academicYear: '2026-2027', className: 'Class 1', sectionName: 'A', rollNumber: 2, dob: '2015-01-01', gender: 'Other' } : { qualification: 'B.Ed', designation: 'Teacher', joiningDate: '2026-04-01', employeeType: 'Permanent', experience: 0 }) });
  const help = book.addWorksheet('Instructions');
  help.columns = [{ header: 'Column', key: 'column', width: 30 }, { header: 'Description', key: 'description', width: 110 }];
  for (const key of workbookColumns(kind)) help.addRow({ column: key, description: key === 'password' ? 'Required for create only. Must be blank for update. 8+ characters, maximum 72 UTF-8 bytes. Never included in previews/exports.' : key === identifier(kind) ? 'Server-generated: blank on create; preferred exact matching key on update. Immutable.' : ['academicYear', 'className', 'sectionName'].includes(key) ? 'Exact academic name; all three required for student creation/placement changes or scoped roll matching.' : ['accountActive', 'isActive'].includes(key) ? 'true/false. Blank preserves on update; defaults true on create.' : ['dob', 'admissionDate', 'joiningDate'].includes(key) ? 'YYYY-MM-DD date. Student dob and Teacher joiningDate required at creation.' : 'Blank preserves on update. See guide for required creation fields. No salary, role, bank or government-ID columns.' });
  return book;
}
export async function exportPeople(kind, query) {
  const { records } = await listPeople(kind, query, true);
  const book = profileTemplate(kind), sheet = book.worksheets[0]; sheet.spliceRows(2, 1);
  for (const row of records) {
    const data = { ...row, fullname: row.user?.fullname, email: row.user?.email, phone: row.user?.phone || row.phone || '', accountActive: String(Boolean(row.user?.isActive)), isActive: String(row.isActive), password: '', academicYear: row.schoolClass?.academicYear?.name, className: row.schoolClass?.name, sectionName: row.section?.name };
    for (const key of ['dob', 'joiningDate', 'admissionDate']) if (data[key]) data[key] = new Date(data[key]).toISOString().slice(0, 10);
    sheet.addRow(Object.fromEntries(workbookColumns(kind).map(key => [key, safeCell(data[key] ?? '')])));
  }
  return book;
}
function signature(file, kind, mode, actor, expires) { return createHmac('sha256', process.env.JWT_SECRET).update(`${actor._id}:${kind}:${mode}:${expires}:`).update(file.buffer).digest('hex'); }
export async function importPeople(kind, file, body, actor) {
  const Model = peopleModel(kind), key = identifier(kind), mode = body.mode || 'create';
  if (!['create', 'update'].includes(mode)) fail(400, 'Select create or update mode');
  if (!file || !/\.xlsx$/i.test(file.originalname) || file.size > 5 * 1024 * 1024) fail(400, 'Use an .xlsx file up to 5 MB');
  const commit = body.phase === 'commit';
  if (body.phase && !['preview', 'commit'].includes(body.phase)) fail(400, 'Invalid import phase');
  if (commit) {
    const [expires, digest] = String(body.previewToken || '').split('.');
    const expected = signature(file, kind, mode, actor, expires);
    if (!/^\d+$/.test(expires) || Number(expires) < Date.now() || !/^[a-f0-9]{64}$/.test(digest || '') || !timingSafeEqual(Buffer.from(digest), Buffer.from(expected))) fail(400, 'Preview expired or file changed. Preview again before confirming.');
  }
  const book = new ExcelJS.Workbook();
  try { await book.xlsx.load(file.buffer); } catch { fail(400, 'Invalid Excel workbook'); }
  const sheet = book.worksheets[0], columns = workbookColumns(kind);
  if (!sheet || sheet.rowCount > 1001 || sheet.columnCount !== columns.length || columns.some((key, i) => sheet.getRow(1).getCell(i + 1).text.trim() !== key)) fail(400, 'Use the matching template, at most 1000 rows, with unchanged column headings');
  const rows = [], seen = new Set(), seenEmails = new Set(), seenRolls = new Set();
  let created = 0, updated = 0;
  for (let number = 2; number <= sheet.rowCount; number++) {
    if (!sheet.getRow(number).hasValues) continue;
    try {
      const data = {};
      for (let i = 0; i < columns.length; i++) {
        const cell = sheet.getRow(number).getCell(i + 1);
        if (cell.formula || (cell.value && typeof cell.value === 'object' && !(cell.value instanceof Date))) fail(400, 'Only plain text, number or date cells are supported');
        const value = cell.value instanceof Date ? cell.value.toISOString().slice(0, 10) : cell.text.trim();
        if (value !== '') data[columns[i]] = value;
      }
      const suppliedId = data[key]; delete data[key];
      if (mode === 'create' && suppliedId) fail(400, 'Leave generated identifier blank when creating records');
      if (mode === 'update' && data.password !== undefined) fail(400, 'Password must be blank in update rows');
      for (const k of ['accountActive', 'isActive']) if (data[k] !== undefined) { if (!['true', 'false'].includes(data[k])) fail(400, `Invalid ${k}: use true or false`); data[k] = data[k] === 'true'; }
      let target;
      if (kind === 'students') {
        const hasScope = ['academicYear', 'className', 'sectionName'].some(k => data[k]);
        if (hasScope || mode === 'create' || !suppliedId) {
          if (!data.academicYear || !data.className || !data.sectionName) fail(400, 'Academic year, class and section names are required together');
          const years = await AcademicYear.find({ name: data.academicYear, isActive: true });
          if (years.length !== 1) fail(400, 'Academic year is missing, inactive or ambiguous');
          const classes = await SchoolClass.find({ name: data.className, academicYear: years[0]._id, isActive: true });
          if (classes.length !== 1) fail(400, 'Class is missing, inactive or ambiguous');
          const sections = await Section.find({ name: data.sectionName, schoolClass: classes[0]._id, isActive: true });
          if (sections.length !== 1) fail(400, 'Section is missing, inactive or ambiguous');
          data.schoolClass = String(classes[0]._id); data.section = String(sections[0]._id);
        }
        delete data.academicYear; delete data.className; delete data.sectionName;
        if (mode === 'update' && !suppliedId) {
          if (!data.rollNumber) fail(400, 'Provide admission ID or fully scoped roll number');
          const matches = await Model.find({ schoolClass: data.schoolClass, section: data.section, rollNumber: Number(data.rollNumber) });
          if (matches.length !== 1) fail(400, 'Roll-number match is missing or ambiguous'); target = matches[0];
        }
      }
      if (mode === 'update' && !target) {
        if (!suppliedId) fail(400, 'Employee ID is required for update');
        target = await Model.findOne({ [key]: suppliedId }); if (!target) fail(400, 'Identifier does not match a record');
      }
      const match = target ? String(target._id) : String(data.email || '').toLowerCase();
      if (seen.has(match)) fail(400, 'Duplicate record within this file'); seen.add(match);
      if (data.email) {
        const email = data.email.toLowerCase();
        if (target && (await User.findById(target.user).select('email'))?.email !== email) fail(400, 'Use the separate change-login-email action; imports cannot change login identity');
        if (seenEmails.has(email)) fail(400, 'Duplicate email within this file'); seenEmails.add(email);
        if (await User.exists({ email, ...(target ? { _id: { $ne: target.user } } : {}) })) fail(400, 'Email already belongs to another account');
      }
      profileValues(data);
      if (mode === 'create') password(data.password);
      if (kind === 'students') {
        validateStudent(data, mode === 'create');
        const scope = { schoolClass: data.schoolClass || target?.schoolClass, section: data.section || target?.section, rollNumber: Number(data.rollNumber ?? target?.rollNumber) };
        const roll = `${scope.schoolClass}:${scope.section}:${scope.rollNumber}`;
        if (seenRolls.has(roll) || await Model.exists({ ...scope, ...(target ? { _id: { $ne: target._id } } : {}) })) fail(400, 'Duplicate roll number in class and section'); seenRolls.add(roll);
      } else {
        for (const k of ['fullname', 'email', 'qualification', 'designation', 'joiningDate']) if (mode === 'create' && !data[k]) fail(400, `${k} is required`);
        if (data.employeeType && !['Permanent', 'Contract', 'Guest'].includes(data.employeeType)) fail(400, 'Invalid employment type');
      }
      if (commit) await savePerson(kind, target?._id, data, actor);
      if (target) updated++; else created++;
      rows.push({ row: number, action: target ? 'update' : 'create', identifier: target?.[key] || 'Generated on creation', name: data.fullname || '', status: commit ? 'saved' : 'valid' });
    } catch (error) {
      rows.push({ row: number, action: 'error', reason: error.code === 11000 ? 'Duplicate email, identifier or scoped roll number' : error.status && error.status < 500 ? error.message : 'Invalid row or database write failed' });
    }
  }
  const expires = Date.now() + 15 * 60 * 1000;
  return { phase: commit ? 'commit' : 'preview', created, updated, failed: rows.filter(r => r.action === 'error').length, rows, ...(!commit ? { previewToken: `${expires}.${signature(file, kind, mode, actor, expires)}` } : {}) };
}
