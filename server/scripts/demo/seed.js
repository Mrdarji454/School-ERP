import mongoose from 'mongoose';
import Enrollment from '../../models/Enrollment.js';
import EnrollmentTransition from '../../models/EnrollmentTransition.js';
import { initialEnrollment } from '../../services/enrollments.js';
import * as M from './models.js';
import { demoId, MANIFEST_ID, manifestCollection, seedDate, completedDays, relativeDate, randomValue, safeError } from './config.js';
import { transaction } from '../../utils/transaction.js';
import { classSection, assignmentRelations } from '../../utils/relationships.js';
import { validateStudent } from '../../services/student/studentCore.js';
import { saveTimetable } from '../../services/timetableService.js';
import { validateAttendance, updateAttendanceRecord } from '../../services/attendanceService.js';
import { setAttendanceLock } from '../../services/workflow.js';
import { recordPayment, reversePayment } from '../../services/paymentService.js';
import { startDemoApi } from './api.js';
export const subjects = ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Computer Studies'];
export const subjectCodes = ['ENG', 'MATH', 'SCI', 'SOC', 'HIN', 'COMP'];
export const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const teacherFor = (section, subject) => (section + subject) % 10 + (subject < 3 ? 0 : 10) + 1;
const names = ['Aarav', 'Ananya', 'Vihaan', 'Diya', 'Ishaan', 'Meera', 'Kabir', 'Riya', 'Arjun', 'Tara', 'Dev', 'Sana', 'Neel', 'Ira', 'Rohan', 'Kavya', 'Yash', 'Nisha', 'Aditya', 'Avni', 'Rehan', 'Mira', 'Kiran', 'Navya', 'Samar'];
const surnames = ['Shah', 'Patel', 'Rao', 'Mehta', 'Joshi', 'Sharma', 'Iyer', 'Desai', 'Verma', 'Sen', 'Kapoor', 'Nair', 'Kulkarni', 'Bose', 'Sethi', 'Trivedi', 'Menon', 'Bhat', 'Saxena', 'Pillai'];
export const studentNumber = (section, roll) => (roll - 1) * 10 + section + 1;
export const sectionLabel = index => `Class ${6 + Math.floor(index / 2)} ${index % 2 ? 'B' : 'A'}`;
export const studentSection = number => (number - 1) % 10;
function syntheticName(config, number, kind) { return `${names[Math.floor(randomValue(config.randomSeed, `${kind}/first/${number}`) * names.length)]} ${surnames[Math.floor(randomValue(config.randomSeed, `${kind}/last/${number}`) * surnames.length)]}`; }
function statusFor(config, student, date, slot) {
  const n = Number(student.admissionNo.slice(-3)), value = randomValue(config.randomSeed, `${n}/${date}/${slot}`);
  const present = n % 10 === 3 ? 0.48 : n % 10 === 2 ? 0.74 : 0.94;
  if (value < present) return 'Present';
  const other = (value - present) / (1 - present);
  return other < 0.5 ? 'Absent' : other < 0.72 ? 'Late' : other < 0.86 ? 'Half Day' : 'Leave';
}
export async function seedDemo(config, log = console.log) {
  const collection = manifestCollection();
  const existing = await collection.findOne({ _id: MANIFEST_ID });
  if (existing?.state === 'complete') { log(`Demo already seeded for ${existing.seedDate} (${existing.timeZone}). No documents or manual edits changed.`); return { manifest: existing, created: false }; }
  if (existing) throw safeError('An incomplete seed exists. Inspect it, then use the explicitly confirmed demo reset to rebuild.');
  for (const info of await mongoose.connection.db.listCollections().toArray()) if (!info.name.startsWith('system.') && await mongoose.connection.db.collection(info.name).findOne({}, { projection: { _id: 1 } })) throw safeError('Demo database is not empty and has no completed seed manifest. Existing data will not be overwritten.');
  const date = seedDate(config), dates = completedDays(date);
  if (!dates.length) throw safeError('Choose a DEMO_SEED_DATE after the first completed working day in 2026–2027 so attendance examples can be created.');
  const manifest = { _id: MANIFEST_ID, state: 'building', school: 'Demo Vidya School', seedDate: date, timeZone: config.timeZone, randomSeed: config.randomSeed, defaultPassword: config.defaultPassword, attendanceDates: dates, createdAt: new Date(), samples: {}, unmarked: [] };
  await collection.insertOne(manifest); // Unique _id also serializes competing first seed runs.
  for (const Model of Object.values(M.models)) { await Model.createCollection(); await Model.createIndexes(); }
  await Enrollment.createIndexes(); await EnrollmentTransition.createIndexes();
  const admin = await M.User.create({ _id: demoId('admin'), fullname: 'Demo Vidya Administrator', email: 'admin@demo.example.test', password: config.password, role: 'Admin', phone: '' });
  const year = await M.AcademicYear.create({ _id: demoId('year/current'), name: '2026-2027', startDate: '2026-04-01', endDate: '2027-03-31', isCurrent: true });
  await M.AcademicYear.create({ _id: demoId('year/prior'), name: '2025-2026', startDate: '2025-04-01', endDate: '2026-03-31', isCurrent: false });
  log('Creating fictional accounts and academic setup…');
  const teachers = [];
  for (let n = 1; n <= 20; n++) {
    const teacher = await transaction(async session => {
      const [user] = await M.User.create([{ _id: demoId(`teacher-user/${n}`), fullname: syntheticName(config, n, 'teacher'), email: `teacher${n}@demo.example.test`, password: config.password, role: 'Teacher', phone: '0000000000' }], { session });
      const [profile] = await M.Teacher.create([{ _id: demoId(`teacher/${n}`), user: user._id, employeeId: `DVS-T${String(n).padStart(3, '0')}`, qualification: n % 2 ? 'M.A., B.Ed.' : 'M.Sc., B.Ed.', experience: 2 + n % 14, designation: n <= 10 ? 'Class Teacher' : 'Subject Teacher', joiningDate: `${2018 + n % 7}-${String(1 + n % 12).padStart(2, '0')}-15`, dob: '1990-01-01', emergencyContact: '0000000000', department: subjects[(n - 1) % 6], employeeType: n % 5 ? 'Permanent' : 'Contract', address: `Fictional Staff Block ${n}, Demo Learning Campus (not a real address)`, createdBy: admin._id }], { session });
      return profile;
    });
    teachers.push(teacher);
  }
  const sections = [], assignments = [], students = [];
  for (let c = 0; c < 5; c++) {
    const cls = await M.SchoolClass.create({ _id: demoId(`class/${c}`), name: `Class ${c + 6}`, academicYear: year._id, description: 'Fictional demo current-year class' });
    const classSubjects = [];
    for (let j = 0; j < 6; j++) classSubjects.push(await M.Subject.create({ _id: demoId(`subject/${c}/${j}`), name: subjects[j], code: subjectCodes[j], schoolClass: cls._id, description: 'Demo curriculum', createdBy: admin._id }));
    for (let b = 0; b < 2; b++) {
      const s = c * 2 + b;
      const section = await M.Section.create({ _id: demoId(`section/${s}`), name: b ? 'B' : 'A', schoolClass: cls._id, capacity: 30, classTeacher: teachers[teacherFor(s, 0) - 1]._id, createdBy: admin._id });
      sections.push(section);
      for (let j = 0; j < 6; j++) {
        const body = { _id: demoId(`assignment/${s}/${j}`), academicYear: year._id, schoolClass: cls._id, section: section._id, subject: classSubjects[j]._id, teacher: teachers[teacherFor(s, j) - 1]._id, isClassTeacher: j === 0, createdBy: admin._id, remarks: 'Fictional demo teaching assignment' };
        await assignmentRelations(body);
        assignments.push({ sectionIndex: s, subjectIndex: j, record: await M.TeacherAssignment.create(body) });
      }
      for (let roll = 1; roll <= 25; roll++) {
        const n = studentNumber(s, roll), isActive = n < 249;
        const data = { fullname: syntheticName(config, n, 'student'), email: `student${n}@demo.example.test`, password: config.password, rollNumber: roll, schoolClass: cls._id, section: section._id, guardianName: `Fictional Guardian ${n} A`, guardianRelationship: 'Parent', guardianPhone: '0000000000', additionalGuardianPhone: '0000000000', admissionDate: '2026-04-01', fatherName: `Fictional Guardian ${n} A`, motherName: `Fictional Guardian ${n} B`, dob: `${2015 - c}-${String(1 + n % 12).padStart(2, '0')}-${String(1 + n % 27).padStart(2, '0')}`, gender: n % 2 ? 'Male' : 'Female', phone: '0000000000', address: `Demo Home ${n}, Imaginary Education Lane (not a real address)` };
        validateStudent(data, true);
        const profile = await transaction(async session => {
          await classSection(data.schoolClass, data.section, session);
          const [user] = await M.User.create([{ _id: demoId(`student-user/${n}`), fullname: data.fullname, email: data.email, password: data.password, role: 'Student', phone: data.phone, isActive }], { session });
          const { fullname: _name, email: _email, password: _password, ...fields } = data;
          const [student] = await M.Student.create([{ ...fields, _id: demoId(`student/${n}`), user: user._id, admissionNo: `DVS-S${String(n).padStart(3, '0')}`, isActive }], { session });
          await initialEnrollment(student, { enrollmentStart: '2026-04-01', enrollmentReason: 'Known fictional demo admission date' }, admin, session);
          return student;
        });
        students.push(profile);
      }
    }
  }
  const periodData = [['Period 1', '09:00', '09:45', false], ['Period 2', '09:45', '10:30', false], ['Morning break', '10:30', '10:50', true], ['Period 3', '10:50', '11:35', false], ['Period 4', '11:35', '12:20', false], ['Period 5', '12:20', '13:05', false]];
  const periods = [];
  for (const [i, [name, startTime, endTime, isBreak]] of periodData.entries()) periods.push(await M.Period.create({ _id: demoId(`period/${i}`), name, periodNumber: i + 1, startTime, endTime, isBreak, createdBy: admin._id }));
  const teaching = periods.filter(p => !p.isBreak), bookings = [];
  log('Creating 300 bookings through the existing transactional scheduling service…');
  for (let d = 0; d < 6; d++) for (let p = 0; p < 5; p++) for (let s = 0; s < 10; s++) {
    const subjectIndex = (d + p) % 6, assignment = assignments.find(a => a.sectionIndex === s && a.subjectIndex === subjectIndex).record;
    const body = { academicYear: year._id, teacherAssignment: assignment._id, day: weekdays[d], period: teaching[p]._id, roomNumber: `DVS-${6 + Math.floor(s / 2)}${s % 2 ? 'B' : 'A'}` };
    // A deterministic inactive shell is validated/activated by saveTimetable; conflicts are never bypassed.
    const shell = await M.Timetable.create({ _id: demoId(`booking/${d}/${p}/${s}`), ...body, isActive: false, createdBy: admin._id });
    const record = await saveTimetable(shell._id, body, admin);
    bookings.push({ record, sectionIndex: s, slot: p, assignment });
  }
  const api = await startDemoApi();
  try {
    const token = (await api.request('POST', '/auth/login', { email: 'admin@demo.example.test', password: config.password })).token;
    log(`Creating attendance over ${dates.length} completed working days; today's lessons remain unmarked…`);
    let sessionIndex = 0;
    for (const [dayIndex, day] of dates.entries()) {
      const weekday = weekdays[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7];
      for (const booking of bookings.filter(b => b.record.day === weekday)) {
        const { sectionIndex: s, slot: p, assignment } = booking;
        if ((dayIndex + s * 3 + p) % 11 === 0) { manifest.unmarked.push({ date: day, assignment: String(assignment._id), period: String(booking.record.period), section: sectionLabel(s) }); continue; }
        const roster = students.filter(student => student.isActive && String(student.section) === String(assignment.section));
        const teacherUser = await M.User.findById(teachers[teacherFor(s, (weekdays.indexOf(weekday) + p) % 6) - 1].user);
        const data = await validateAttendance({ teacherAssignment: String(assignment._id), period: String(booking.record.period), attendanceDate: day, students: roster.map(student => ({ student: String(student._id), status: statusFor(config, student, day, p), remark: '' })) }, teacherUser);
        let row = await M.Attendance.create({ _id: demoId(`attendance/${day}/${s}/${p}`), ...data, markedBy: teacherUser._id });
        if (sessionIndex < 3) row = await updateAttendanceRecord(row._id, { version: row.__v, students: data.students.map((entry, i) => i ? entry : { ...entry, status: 'Present', remark: 'Demo correction reviewed' }), reason: 'Fictional register correction exercise' }, admin);
        if (sessionIndex >= 3 && sessionIndex < 6) {
          await api.request('DELETE', `/attendance/${row._id}`, { version: row.__v, reason: 'Demo duplicate observation deactivated; retained as history' }, token);
          manifest.samples.inactive ||= String(row._id);
        } else if (sessionIndex % 7 === 0) {
          row = await setAttendanceLock(admin, row._id, { version: row.__v, isLocked: true, reason: 'Demo attendance reviewed by Admin' });
          manifest.samples.locked ||= String(row._id);
        } else {
          manifest.samples.unlocked ||= String(row._id);
          if (String(assignment.teacher) === String(teachers[0]._id)) manifest.samples.teacher1Unlocked ||= String(row._id);
        }
        sessionIndex++;
      }
    }
    const bounded = delta => { const d = relativeDate(date, delta); return d < '2026-04-01' ? '2026-04-01' : d > '2027-03-31' ? '2027-03-31' : d; };
    for (const [i, [title, type, offset]] of [['Demo Science Showcase', 'Event', 5], ['Demo Reading Week', 'Event', 9], ['Demo School Holiday', 'Holiday', 12], ['Demo Term Assessment Calendar', 'Exam', 18], ['Prior-year closing ceremony (no enrollment history)', 'Event', 0]].entries()) {
      const prior = i === 4, eventDate = prior ? '2026-03-28' : bounded(offset);
      await M.AcademicCalendar.create({ _id: demoId(`calendar/${i}`), academicYear: prior ? demoId('year/prior') : year._id, title, type, startDate: eventDate, endDate: eventDate, description: 'Fictional calendar entry; no exam/results module or historical enrollment is created.', createdBy: admin._id });
    }
    const noticeData = [
      ['Demo welcome notice', relativeDate(date, -5), null, true], ['Demo library reading challenge', relativeDate(date, -2), null, true], ['Demo upcoming notice', relativeDate(date, 7), null, true], ['Demo expired notice', relativeDate(date, -10), relativeDate(date, -2), true], ['Demo inactive notice', relativeDate(date, -3), null, false],
    ];
    for (const [i, [title, publishDate, expiryDate, isActive]] of noticeData.entries()) await M.Notification.create({ _id: demoId(`notice/${i}`), title, message: `${title}: fictional content for local application testing only.`, type: 'Notice', priority: i === 0 ? 'High' : 'Low', publishDate, expiryDate, isActive, createdBy: admin._id });
    log('Creating fee/salary balances and transactional, idempotent payments…');
    const feeStructure = await M.FeeStructure.create({ _id: demoId('fee-structure'), academicYear: year._id, feeType: 'Annual', amount: 12000, dueDate: bounded(14), description: 'Fictional annual school fee', createdBy: admin._id });
    for (const student of students.filter(s => s.isActive)) {
      // Deterministic balance shell mirrors createStudentFee after the same relationship/year checks.
      await classSection(student.schoolClass, student.section);
      const n = Number(student.admissionNo.slice(-3));
      const fee = await M.StudentFee.create({ _id: demoId(`student-fee/${n}`), student: student._id, feeStructure: feeStructure._id, totalAmount: 12000, remainingAmount: 12000, paidAmount: 0, createdBy: admin._id });
      if ([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(n)) {
        const payment = await recordPayment('fee', { studentFee: String(fee._id), amount: n === 4 ? 3000 : n === 1 || n % 2 === 0 && n !== 2 ? 12000 : 4000, paymentMethod: 'Cash', remarks: 'Fictional demo receipt' }, admin, `demo-v1-fee-${n}`);
        if (n === 4) await reversePayment('fee', payment._id, admin, 'Demo reversal exercise');
      }
    }
    for (const [index, teacher] of teachers.entries()) {
      await M.SalaryStructure.create({ _id: demoId(`salary-structure/${index + 1}`), teacher: teacher._id, basicSalary: 30000 + index * 500, allowance: 2000, deduction: 1000, effectiveFrom: '2026-04-01', description: 'Fictional monthly salary structure', createdBy: admin._id });
      const salary = await api.request('POST', '/teacher-salaries', { teacher: String(teacher._id), month: Number(date.slice(5, 7)), year: Number(date.slice(0, 4)) }, token, 201);
      if ([0, 1, 3, 4, 5].includes(index)) {
        const payment = await recordPayment('salary', { teacherSalary: salary._id, amount: index === 3 ? 5000 : [0, 4].includes(index) ? salary.netSalary : 10000, paymentMethod: 'Cash', remarks: 'Fictional demo salary payment' }, admin, `demo-v1-salary-${index + 1}`);
        if (index === 3) await reversePayment('salary', payment._id, admin, 'Demo salary reversal exercise');
      }
    }
  } finally { await api.close(); }
  manifest.state = 'complete'; manifest.counts = await M.counts(); manifest.completedAt = new Date();
  manifest.samples.teacher1Assignment = String(demoId('assignment/0/0'));
  manifest.samples.teacher2Assignment = String(demoId('assignment/1/0'));
  await collection.replaceOne({ _id: MANIFEST_ID }, manifest);
  return { manifest, created: true };
}
