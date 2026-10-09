import ExcelJS from "exceljs";
import AcademicYear from "../../models/AcademicYear.js";
import SchoolClass from "../../models/SchoolClass.js";
import Section from "../../models/Section.js";
import Student from "../../models/Student.js";
import { createProfile, populateStudent, studentFilter } from "./studentCore.js";
import { fail } from "../../utils/errors.js";
export const columns = ["fullname", "email", "password", "admissionNo", "rollNumber", "className", "sectionName", "fatherName", "motherName", "gender", "dob", "phone", "address", "bloodGroup", "academicYear"];
export function sampleWorkbook() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Students");
  sheet.columns = columns.map(key => ({ header: key, key, width: 22 }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow({ fullname: "Example Student", email: "student@example.com", password: "ReplaceBeforeImport!", rollNumber: 1, className: "Class 1", sectionName: "A", fatherName: "Parent", motherName: "Parent", gender: "Other", dob: "2015-01-01", phone: "9999999999", academicYear: "2026-2027" });
  return book;
}
export async function importWorkbook(file) {
  if (!file || !/\.xlsx$/i.test(file.originalname) || file.size > 5 * 1024 * 1024) fail(400, "Upload an .xlsx file no larger than 5 MB");
  const book = new ExcelJS.Workbook();
  try { await book.xlsx.load(file.buffer); } catch { fail(400, "Invalid Excel workbook"); }
  const sheet = book.worksheets[0];
  if (!sheet || sheet.rowCount > 1001 || sheet.columnCount !== columns.length) fail(400, "Use the sample template, with at most 1000 student rows");
  if (columns.some((key, i) => sheet.getRow(1).getCell(i + 1).text.trim() !== key)) fail(400, "Column headings must match the sample template exactly");
  const success = [], errors = [];
  for (let row = 2; row <= sheet.rowCount; row++) {
    const excelRow = sheet.getRow(row);
    if (!excelRow.hasValues) continue;
    try {
      const data = Object.fromEntries(columns.map((key, i) => {
        const cell = excelRow.getCell(i + 1);
        if (cell.formula || (cell.value && typeof cell.value === "object" && !(cell.value instanceof Date))) fail(400, "Use plain text or date cells; formulas and rich cells are unsupported");
        return [key, cell.value instanceof Date ? cell.value.toISOString().slice(0, 10) : cell.text.trim()];
      }));
      const year = await AcademicYear.findOne({ name: data.academicYear, isActive: true });
      if (!year) fail(400, "Academic year is missing or inactive");
      const cls = await SchoolClass.findOne({ name: data.className, academicYear: year._id, isActive: true });
      if (!cls) fail(400, "Class is missing or inactive in this academic year");
      const section = await Section.findOne({ name: data.sectionName.toUpperCase(), schoolClass: cls._id, isActive: true });
      if (!section) fail(400, "Section is missing or inactive in this class");
      const student = await createProfile({ ...data, schoolClass: cls._id, section: section._id });
      success.push({ row, admissionNo: student.admissionNo });
    } catch (error) {
      if (error.status === 503) throw error;
      errors.push({ row, reason: error.code === 11000 ? "Email or admission number already exists" : error.status ? error.message : "Invalid row or database write failed" });
    }
  }
  return { imported: success.length, failed: errors.length, success, errors };
}
export async function exportWorkbook(query) {
  const students = await populateStudent(Student.find(await studentFilter(query)));
  const book = new ExcelJS.Workbook(), sheet = book.addWorksheet("Students");
  sheet.columns = ["admissionNo", "fullname", "email", "phone", "class", "section", "status"].map(key => ({ header: key, key, width: 24 }));
  for (const s of students) sheet.addRow({ admissionNo: s.admissionNo, fullname: s.user?.fullname, email: s.user?.email, phone: s.phone, class: s.schoolClass?.name, section: s.section?.name, status: s.isActive ? "Active" : "Inactive" });
  return book;
}
