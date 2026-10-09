import test from "node:test";
import assert from "node:assert/strict";
import { authorize } from "../middleware/roleMiddleware.js";
import { bookingConflict, overlaps } from "../services/timetableService.js";
import { validateEntries } from "../services/attendanceService.js";
import { schoolDate, schoolToday } from "../utils/schoolDate.js";
import { balanceAfter, cents } from "../services/paymentService.js";
import { summarizeAttendance } from "../services/dashboard/dashboardData.js";
import { studentSchema, editStudentSchema } from "../../client/src/validations/studentSchema.js";
test("roles are separate exact matches", () => {
  for (const role of ["Admin", "Teacher", "Student", "Ad", undefined]) {
    let allowed = false, status;
    authorize("Admin", "Teacher")({ user: role ? { role } : null }, { status: n => { status = n; return { json() {} }; } }, () => { allowed = true; });
    assert.equal(allowed, ["Admin", "Teacher"].includes(role));
    if (!allowed) assert.equal(status, 403);
  }
});
test("booking conflicts cover teacher, class and normalized rooms, with adjacent intervals allowed", () => {
  const a = { period: { startTime: "09:00", endTime: "10:00" }, teacherAssignment: { teacher: "t1", schoolClass: "c1", section: "s1" }, roomNumber: " Lab " };
  const b = { period: { startTime: "09:30", endTime: "10:30" }, teacherAssignment: { teacher: "t2", schoolClass: "c2", section: "s2" }, roomNumber: "lab" };
  assert.equal(bookingConflict(a, b), true);
  b.roomNumber = "other"; assert.equal(bookingConflict(a, b), false);
  b.teacherAssignment.teacher = "t1"; assert.equal(bookingConflict(a, b), true);
  b.teacherAssignment = { teacher: "t2", schoolClass: "c1", section: "s1" }; assert.equal(bookingConflict(a, b), true);
  assert.equal(overlaps(a.period, { startTime: "10:00", endTime: "11:00" }), false);
});
test("attendance rejects duplicate roster entries and invalid statuses", () => {
  const entry = { student: "123456789012345678901234", status: "Present" };
  assert.doesNotThrow(() => validateEntries([entry]));
  assert.throws(() => validateEntries([entry, entry]), /Duplicate/);
  assert.throws(() => validateEntries([{ ...entry, status: "Unknown" }]), /Invalid attendance status/);
});
test("school dates normalize calendar days and reject impossible dates", () => {
  assert.equal(schoolDate("2026-10-08").toISOString(), "2026-10-08T00:00:00.000Z");
  assert.throws(() => schoolDate("2026-02-30"));
  assert.throws(() => schoolDate("2026-10-08T23:00:00Z"));
  process.env.SCHOOL_TIMEZONE = "Asia/Kolkata";
  assert.equal(schoolToday(new Date("2026-10-07T20:00:00Z")).toISOString().slice(0, 10), "2026-10-08");
});
test("finance uses exact minor units, rejects overpayment, and reverses consistently", () => {
  assert.equal(cents("0.29"), 29);
  assert.throws(() => cents("1.001"));
  assert.throws(() => balanceAfter(100, 60, 50));
  assert.deepEqual(balanceAfter(100, 60, 40), { paidAmount: 100, remainingAmount: 0, status: "Paid" });
  assert.deepEqual(balanceAfter(100, 100, 40, true), { paidAmount: 60, remainingAmount: 40, status: "Partial" });
});
test("attendance summary includes half days without inventing a new presence policy", () => {
  const summary = summarizeAttendance([{ students: ["Present", "Half Day", "Leave", "Late"].map(status => ({ status })) }]);
  assert.equal(summary.total, 4); assert.equal(summary.halfDay, 1); assert.equal(summary.attendancePercentage, 25);
});
test("student form contract requires a creation password and permits blank edit password", () => {
  const data = { fullname: "Student", email: "student@example.com", password: "", rollNumber: "1", schoolClass: "class", section: "section", fatherName: "Parent", motherName: "Parent", dob: "2015-01-01", gender: "Other", phone: "9999999999" };
  assert.equal(studentSchema.safeParse(data).success, false);
  assert.equal(studentSchema.safeParse({ ...data, password: "Example123!" }).success, true);
  assert.equal(editStudentSchema.safeParse(data).success, true);
});
