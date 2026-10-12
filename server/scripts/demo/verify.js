import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as M from './models.js';
import { manifestCollection, MANIFEST_ID, demoId, safeError } from './config.js';
import { assignmentRelations, same } from '../../utils/relationships.js';
import { bookingConflict } from '../../services/timetableService.js';
import { summarizeAttendance } from '../../services/dashboard/dashboardData.js';
import { startDemoApi } from './api.js';
import { seedDemo } from './seed.js';
import LearningResource from '../../models/LearningResource.js';
import { EXTENSION_ID } from './extend-learning.js';
export async function fingerprint() {
  const hash = createHash('sha256');
  for (const [name, Model] of Object.entries(M.models)) { hash.update(name); hash.update(JSON.stringify(await Model.find().select(name === 'User' ? '+password' : '').sort({ _id: 1 }).lean())); }
  hash.update(JSON.stringify(await LearningResource.find().sort({ _id: 1 }).lean()));
  // The digest stays in memory, never printed or included in the report.
  return hash.digest('hex');
}
export async function verifyDemo(config, { checkRepeat = true } = {}) {
  const manifest = await manifestCollection().findOne({ _id: MANIFEST_ID });
  if (manifest?.state !== 'complete') throw safeError('A completed demo seed is required. Run npm run seed:demo.');
  process.env.SCHOOL_TIMEZONE = manifest.timeZone;
  const actualCounts = await M.counts();
  const extension = await manifestCollection().findOne({ _id: EXTENSION_ID, state: 'complete' });
  const expectedCounts = { ...manifest.counts, Notification: manifest.counts.Notification + (extension?.noticeIds.length || 0), AcademicCalendar: manifest.counts.AcademicCalendar + (extension?.calendarIds.length || 0) };
  assert.deepEqual(actualCounts, expectedCounts, 'Counts differ from the seed plus explicit extension (manual testing may explain this).');
  assert.equal(actualCounts.Student, 250); assert.equal(actualCounts.Teacher, 20); assert.equal(actualCounts.TeacherAssignment, 60); assert.equal(actualCounts.Timetable, 300);
  for (const [name, count] of Object.entries({ User: 271, AcademicYear: 2, SchoolClass: 5, Section: 10, Subject: 30, Period: 6, AcademicCalendar: 5 + (extension?.calendarIds.length || 0), Notification: 5 + (extension?.noticeIds.length || 0), FeeStructure: 1, StudentFee: 248, FeePayment: 11, SalaryStructure: 20, TeacherSalary: 20, SalaryPayment: 5 })) assert.equal(actualCounts[name], count, `${name} fixture count`);
  assert.equal(await M.User.countDocuments({ isActive: false }), 2);
  assert.equal(await M.AcademicYear.countDocuments({ isCurrent: true, isActive: true }), 1);
  assert.equal((await M.AcademicYear.findOne({ isCurrent: true })).name, '2026-2027');
  const all = Object.fromEntries(await Promise.all(Object.entries(M.models).map(async ([name, Model]) => [name, await Model.find().lean()])));
  const maps = Object.fromEntries(Object.entries(all).map(([name, records]) => [name, new Map(records.map(r => [String(r._id), r]))]));
  for (const [name, Model] of Object.entries(M.models)) for (const row of all[name]) for (const [key, schema] of Object.entries(Model.schema.paths)) {
    const ref = schema.options.ref;
    if (ref && row[key]) assert.ok(maps[ref]?.has(String(row[key])), `${name}.${key} reference must exist`);
  }
  for (const assignment of all.TeacherAssignment) await assignmentRelations(assignment);
  for (const section of all.Section) {
    const teachers = all.TeacherAssignment.filter(a => same(a.section, section._id) && a.isClassTeacher && a.isActive);
    assert.equal(teachers.length, 1); assert.ok(same(section.classTeacher, teachers[0].teacher));
    assert.equal(all.Student.filter(s => same(s.section, section._id)).length, 25);
  }
  for (const student of all.Student) {
    assert.ok(same(maps.Section.get(String(student.section)).schoolClass, student.schoolClass));
    assert.equal(maps.User.get(String(student.user)).isActive, student.isActive);
  }
  const bookings = await M.Timetable.find({ isActive: true }).populate('teacherAssignment').populate('period');
  for (const [index, booking] of bookings.entries()) {
    assert.equal(booking.period.isBreak, false); assert.ok(same(booking.academicYear, booking.teacherAssignment.academicYear));
    for (const other of bookings.slice(index + 1)) if (booking.day === other.day && same(booking.academicYear, other.academicYear)) assert.equal(bookingConflict(booking, other), false, 'Demo schedule contains an interval conflict');
  }
  const attendanceKeys = new Set();
  for (const row of all.Attendance) {
    const assignment = maps.TeacherAssignment.get(String(row.teacherAssignment));
    const key = `${row.teacherAssignment}/${row.period}/${row.attendanceDate.toISOString()}`;
    assert.equal(attendanceKeys.has(key), false); attendanceKeys.add(key);
    assert.ok(manifest.attendanceDates.includes(row.attendanceDate.toISOString().slice(0, 10)));
    assert.ok(row.__v >= row.audit.length);
    for (const audit of row.audit) { assert.ok(maps.User.has(String(audit.actor))); assert.ok(audit.at && audit.reason); }
    const seen = new Set();
    for (const entry of row.students) {
      const student = maps.Student.get(String(entry.student));
      assert.ok(student?.isActive); assert.ok(same(student.schoolClass, assignment.schoolClass)); assert.ok(same(student.section, assignment.section));
      assert.equal(seen.has(String(student._id)), false); seen.add(String(student._id));
      assert.ok(['Present', 'Absent', 'Late', 'Half Day', 'Leave'].includes(entry.status));
    }
  }
  const overall = summarizeAttendance(all.Attendance.filter(a => a.isActive));
  if (manifest.attendanceDates.length >= 10) for (const key of ['present', 'absent', 'late', 'halfDay', 'leave']) assert.ok(overall[key] > 0);
  const finance = {};
  for (const [kind, balanceName, paymentName, link, totalField, statusField] of [['fee', 'StudentFee', 'FeePayment', 'studentFee', 'totalAmount', 'paymentStatus'], ['salary', 'TeacherSalary', 'SalaryPayment', 'teacherSalary', 'netSalary', 'status']]) {
    let paid = 0, remaining = 0;
    for (const balance of all[balanceName]) {
      const recorded = all[paymentName].filter(p => same(p[link], balance._id) && !p.isReversed).reduce((sum, p) => sum + Math.round(p.amount * 100), 0);
      assert.equal(Math.round(balance.paidAmount * 100), recorded);
      assert.equal(Math.round(balance.remainingAmount * 100), Math.round(balance[totalField] * 100) - recorded);
      assert.equal(balance[statusField], balance.remainingAmount === 0 ? 'Paid' : recorded === 0 ? 'Pending' : 'Partial');
      paid += balance.paidAmount; remaining += balance.remainingAmount;
    }
    finance[kind] = { paid, remaining, reversedPayments: all[paymentName].filter(p => p.isReversed).length, pending: all[balanceName].filter(b => b[statusField] === 'Pending').length, partial: all[balanceName].filter(b => b[statusField] === 'Partial').length, fullyPaid: all[balanceName].filter(b => b[statusField] === 'Paid').length };
    assert.ok(finance[kind].reversedPayments >= 1);
  }
  for (const salary of all.TeacherSalary) { const structure = maps.SalaryStructure.get(String(salary.salaryStructure)); assert.ok(same(structure.teacher, salary.teacher)); assert.equal(salary.grossSalary, structure.basicSalary + structure.allowance); assert.equal(salary.netSalary, salary.grossSalary - salary.deduction); }
  for (const fee of all.StudentFee) { const student = maps.Student.get(String(fee.student)); assert.ok(same(maps.SchoolClass.get(String(student.schoolClass)).academicYear, maps.FeeStructure.get(String(fee.feeStructure)).academicYear)); }
  for (const event of all.AcademicCalendar) { const year = maps.AcademicYear.get(String(event.academicYear)); assert.ok(event.startDate >= year.startDate && event.endDate <= year.endDate); }
  const api = await startDemoApi();
  let apiChecks;
  try {
    const tokens = {};
    for (const account of ['admin', 'teacher1', 'teacher2', 'student1', 'student2']) {
      const login = await api.request('POST', '/auth/login', { email: `${account}@demo.example.test`, password: config.password });
      assert.equal(login.user.password, undefined); tokens[account] = login.token;
    }
    for (const n of [249, 250]) await api.request('POST', '/auth/login', { email: `student${n}@demo.example.test`, password: config.password }, null, 401);
    for (const n of [1, 2]) {
      const timetable = await api.request('GET', '/workflow/timetables', null, tokens[`teacher${n}`]);
      assert.equal(timetable.records.length, 15); assert.ok(timetable.records.every(r => same(r.teacherAssignment.teacher._id, demoId(`teacher/${n}`))));
      assert.ok(timetable.records.every(r => !('salary' in r.teacherAssignment.teacher)));
      const roster = await api.request('GET', `/workflow/roster?teacherAssignment=${manifest.samples[`teacher${n}Assignment`]}&period=${demoId('period/0')}&date=${manifest.seedDate}`, null, tokens[`teacher${n}`]);
      assert.equal(roster.record, null); assert.equal(roster.roster.length, 25);
      const own = await api.request('GET', '/workflow/attendance?limit=100', null, tokens[`student${n}`]);
      const rows = all.Attendance.filter(a => a.isActive).map(a => ({ students: a.students.filter(e => same(e.student, demoId(`student/${n}`))) }));
      assert.deepEqual(own.summary, summarizeAttendance(rows));
      assert.ok(own.records.every(r => !('students' in r) && !('audit' in r) && !('remark' in r)));
      const studentTimetable = await api.request('GET', '/workflow/timetables', null, tokens[`student${n}`]);
      assert.equal(studentTimetable.records.length, 30); assert.ok(studentTimetable.records.every(r => same(r.teacherAssignment.section._id, demoId(`section/${n - 1}`))));
    }
    await api.request('GET', `/workflow/roster?teacherAssignment=${manifest.samples.teacher2Assignment}&period=${demoId('period/0')}&date=${manifest.seedDate}`, null, tokens.teacher1, 403);
    await api.request('GET', `/workflow/timetables?teacher=${demoId('teacher/2')}`, null, tokens.teacher1, 403);
    await api.request('GET', `/workflow/timetables?section=${demoId('section/1')}`, null, tokens.student1, 403);
    const locked = await M.Attendance.findById(manifest.samples.locked).lean();
    const entries = locked.students.map(e => ({ student: String(e.student), status: e.status, remark: e.remark }));
    await api.request('PUT', `/attendance/${locked._id}`, { version: locked.__v, students: entries }, tokens.admin, 409);
    await api.request('POST', '/attendance', { teacherAssignment: String(locked.teacherAssignment), period: String(locked.period), attendanceDate: locked.attendanceDate.toISOString().slice(0, 10), students: entries }, tokens.admin, 409);
    const emptyDay = await api.request('GET', `/workflow/attendance?date=${manifest.seedDate}`, null, tokens.student1);
    assert.equal(emptyDay.summary.total, 0); assert.equal(emptyDay.summary.absent, 0);
    const now = new Date();
    for (const [account, role] of [['teacher1', 'Teachers'], ['student1', 'Students']]) {
      const targets = role === 'Teachers' ? all.TeacherAssignment.filter(a => a.isActive && same(a.teacher, demoId('teacher/1'))) : [maps.Student.get(String(demoId('student/1')))];
      const visible = all.Notification.filter(n => n.isActive && n.publishDate <= now && (!n.expiryDate || n.expiryDate > now) && (!n.audience || n.audience === 'Everyone' || n.audience === role || (n.audience === 'Selected' && targets.some(t => n.targetClasses?.some(c => same(c, t.schoolClass)) || n.targetSections?.some(s => same(s, t.section)))))).map(n => String(n._id)).sort();
      assert.deepEqual((await api.request('GET', '/workflow/notices', null, tokens[account])).map(n => n._id).sort(), visible);
    }
    const dashboard = await api.request('GET', '/dashboard/admin', null, tokens.admin);
    assert.equal(dashboard.statistics.totalStudents, 248); assert.equal(dashboard.statistics.totalTeachers, 20); assert.equal(dashboard.statistics.feesCollected, finance.fee.paid);
    for (const path of ['students?limit=10', 'admin-management/academic-years', 'admin-management/classes', 'admin-management/sections', 'admin-management/subjects', 'admin-management/teachers', 'admin-management/teacher-assignments', 'workflow/timetables', 'workflow/attendance?limit=10', 'academic-calendar', 'student-fees', 'teacher-salaries', 'fee-payments', 'salary-payments']) await api.request('GET', `/${path}`, null, tokens.admin);
    apiChecks = api.checks;
  } finally { await api.close(); }
  let repeatedSeedPreservesAllDocuments = false;
  if (checkRepeat) { const before = await fingerprint(); await seedDemo(config, () => {}); assert.ok(await fingerprint() === before, 'Repeated seed must preserve every existing document and manual edit'); repeatedSeedPreservesAllDocuments = true; }
  return { verifiedAt: new Date().toISOString(), counts: actualCounts, apiChecks, timetableConflicts: 0, attendance: overall, finance, repeatedSeedPreservesAllDocuments, browserAcceptance: 'Unverified: no connected browser' };
}
