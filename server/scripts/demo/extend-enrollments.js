import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import { demoConfig, connectDemo, manifestCollection, MANIFEST_ID, demoId } from './config.js';
import * as M from './models.js';
import Enrollment from '../../models/Enrollment.js';
import EnrollmentTransition from '../../models/EnrollmentTransition.js';
import { createProfile } from '../../services/student/studentCore.js';
import { previewTransition, commitTransition, checkEnrollmentSlot, legacyRollIndexes } from '../../services/enrollments.js';
import { datedRoster } from '../../services/enrollmentPlacement.js';
import { validateAttendance } from '../../services/attendanceService.js';
import { transaction } from '../../utils/transaction.js';
export const ENROLLMENT_DEMO_ID = 'demo-enrollments-v1';
const id = name => demoId(`enrollment-extension/${name}`);
const ref = name => String(id(name));
// Separate fixtures and a persistent manifest make retries additive, never reset-based.
export async function extendEnrollments(config) {
  const seed = await manifestCollection().findOne({ _id: MANIFEST_ID });
  if (seed?.state !== 'complete') throw new Error('Complete the base demo seed first');
  const prior = await manifestCollection().findOne({ _id: ENROLLMENT_DEMO_ID });
  if (prior?.state === 'complete') return prior;
  if ((await legacyRollIndexes()).length) throw new Error('Explicit enrollment index transition is required first; this extension never drops indexes');
  const admin = await M.User.findById(demoId('admin')), teacher = await M.Teacher.findOne({ isActive: true });
  if (!admin || !teacher) throw new Error('Demo administrator and teacher required');
  if (!prior) {
    if (await M.AcademicYear.exists({ _id: { $in: [id('prior'), id('current')] } }) || await M.User.exists({ email: /@enrollment-demo\.example\.test$/ })) throw new Error('Unmanaged enrollment fixture collision');
    await manifestCollection().insertOne({ _id: ENROLLMENT_DEMO_ID, state: 'building', students: {}, createdAt: new Date() });
  }
  const ensure = async (Model, name, data) => { const existing = await Model.findById(id(name)); return existing || Model.create({ _id: id(name), ...data }); };
  await Enrollment.createIndexes(); await EnrollmentTransition.createIndexes();
  for (const [name, start, end] of [['prior', '2025-04-01', '2026-03-31'], ['current', '2026-04-01', '2027-03-31']]) {
    await ensure(M.AcademicYear, name, { name: `Enrollment demo ${name}`, startDate: start, endDate: end });
    await ensure(M.SchoolClass, `class-${name}`, { name: `Enrollment demo ${name === 'prior' ? 'Class 5' : 'Class 6'}`, academicYear: id(name) });
    await ensure(M.Section, `section-${name}-A`, { name: 'A', schoolClass: id(`class-${name}`) });
  }
  await ensure(M.SchoolClass, 'class-repeat', { name: 'Enrollment demo Class 5 (repeat)', academicYear: id('current') });
  await ensure(M.Section, 'section-repeat', { name: 'A', schoolClass: id('class-repeat') });
  await ensure(M.Section, 'section-current-B', { name: 'B', schoolClass: id('class-current') });
  await ensure(M.Subject, 'subject', { name: 'Enrollment demo English', code: 'ENR-DEMO', schoolClass: id('class-current') });
  await ensure(M.Period, 'period', { name: 'Enrollment demo period', periodNumber: 99, startTime: '18:00', endTime: '18:30' });
  for (const section of ['A', 'B']) await ensure(M.TeacherAssignment, `assignment-${section}`, { academicYear: id('current'), schoolClass: id('class-current'), section: id(`section-current-${section}`), subject: id('subject'), teacher: teacher._id, createdBy: admin._id });
  const students = {};
  for (const [index, name] of ['transfer', 'promotion', 'repeat', 'completion'].entries()) {
    const manifest = await manifestCollection().findOne({ _id: ENROLLMENT_DEMO_ID });
    let student = manifest.students[name] && await M.Student.findById(manifest.students[name]);
    const email = `${name}@enrollment-demo.example.test`;
    if (!student) {
      // Creation is transactional. An interruption before saving the manifest is recovered by the reserved email.
      const user = await M.User.findOne({ email });
      student = user && await M.Student.findOne({ user: user._id });
      if (!student) student = await createProfile({ fullname: `Demo Enrollment ${name}`, email, password: config.password, schoolClass: ref(`class-${index ? 'prior' : 'current'}`), section: ref(`section-${index ? 'prior' : 'current'}-A`), rollNumber: index + 1, dob: '2015-01-01', gender: 'Other', enrollmentStart: index ? '2025-04-01' : '2026-04-01', enrollmentReason: 'Known fictional admission for enrollment verification' }, admin);
      await manifestCollection().updateOne({ _id: ENROLLMENT_DEMO_ID }, { $set: { [`students.${name}`]: student._id } });
    }
    students[name] = student;
  }
  const transitionInputs = [];
  for (const [index, name] of ['transfer', 'promotion', 'repeat', 'completion'].entries()) {
    const source = await Enrollment.findOne({ student: students[name]._id, transitionType: 'admission' }).sort({ startDate: 1 });
    const input = { student: String(students[name]._id), sourceEnrollment: String(source._id), expectedRevision: 1, transitionId: `demo_enrollment_v1_${name}`, type: name, effectiveDate: index ? '2026-04-01' : '2026-10-05', reason: `Explicit fictional ${name} decision`, ...(name === 'completion' ? {} : { academicYear: ref('current'), schoolClass: ref(name === 'repeat' ? 'class-repeat' : 'class-current'), section: ref(name === 'repeat' ? 'section-repeat' : `section-current-${index ? 'A' : 'B'}`), rollNumber: index + 1 }) };
    const preview = await previewTransition(admin, input); await commitTransition(admin, preview.previewToken); transitionInputs.push(input);
  }
  for (const [section, date] of [['A', '2026-10-03'], ['B', '2026-10-06']]) {
    const attendanceId = id(`attendance-${section}`);
    if (await M.Attendance.exists({ _id: attendanceId })) continue;
    await transaction(async session => {
      const data = await validateAttendance({ teacherAssignment: ref(`assignment-${section}`), period: ref('period'), attendanceDate: date, students: [{ student: String(students.transfer._id), status: 'Present' }] }, admin, session);
      await M.Attendance.create([{ _id: attendanceId, ...data, markedBy: admin._id }], { session });
    });
  }
  const fixtureIds = { AcademicYear: ['prior', 'current'].map(id), SchoolClass: ['class-prior', 'class-current', 'class-repeat'].map(id), Section: ['section-prior-A', 'section-current-A', 'section-current-B', 'section-repeat'].map(id), Subject: [id('subject')], Period: [id('period')], TeacherAssignment: ['assignment-A', 'assignment-B'].map(id), Attendance: ['attendance-A', 'attendance-B'].map(id), Student: Object.values(students).map(s => s._id), User: Object.values(students).map(s => s.user?._id || s.user) };
  await manifestCollection().updateOne({ _id: ENROLLMENT_DEMO_ID }, { $set: { state: 'complete', transitionInputs, fixtureIds, completedAt: new Date() } });
  return manifestCollection().findOne({ _id: ENROLLMENT_DEMO_ID });
}
export async function verifyEnrollmentDemo() {
  const manifest = await manifestCollection().findOne({ _id: ENROLLMENT_DEMO_ID });
  assert.equal(manifest?.state, 'complete');
  const students = Object.values(manifest.students);
  assert.equal(await Enrollment.countDocuments({ student: { $in: students } }), 7);
  assert.equal(await EnrollmentTransition.countDocuments({ student: { $in: students } }), 8);
  for (const [section, date, expected] of [['A', '2026-10-04', true], ['A', '2026-10-05', false], ['B', '2026-10-05', true]]) {
    const roster = await datedRoster(await M.TeacherAssignment.findById(id(`assignment-${section}`)), new Date(date));
    assert.equal(roster.some(s => String(s._id) === String(manifest.students.transfer)), expected);
  }
  assert.equal(await M.Attendance.countDocuments({ _id: { $in: [id('attendance-A'), id('attendance-B')] } }), 2);
  const row = await Enrollment.findOne({ student: manifest.students.transfer, transitionType: 'transfer' });
  await assert.rejects(() => checkEnrollmentSlot(row.toObject(), null), /overlap/);
  await assert.rejects(() => checkEnrollmentSlot({ ...row.toObject(), student: new mongoose.Types.ObjectId() }, null), /Roll number/);
  const admin = await M.User.findById(demoId('admin'));
  await assert.rejects(() => previewTransition(admin, { ...manifest.transitionInputs[0], sourceEnrollment: String(row._id), expectedRevision: 2, transitionId: 'demo_rejected_backdate_v1', effectiveDate: '2026-10-04' }), /after the latest|invalidate/);
  return { students: 4, enrollments: 7, transitions: 8, attendanceSessions: 2, rejectedConflicts: 3 };
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/extend-enrollments.js')) {
  try {
    const config = demoConfig(); await connectDemo(config);
    if (!process.argv.includes('--verify')) await extendEnrollments(config);
    console.log(JSON.stringify(await verifyEnrollmentDemo(), null, 2));
  } catch (error) { console.error(error.status ? error.message : 'Enrollment demo failed. Check explicit demo URI, completed seed, signing secret and index readiness. Existing data was not reset.'); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
}
