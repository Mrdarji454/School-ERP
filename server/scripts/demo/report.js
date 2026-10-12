import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from './models.js';
import { sectionLabel, studentSection, teacherFor, subjects, weekdays } from './seed.js';
import { summarizeAttendance } from '../../services/dashboard/dashboardData.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export async function writeDemoReport(manifest, verification) {
  const teachers = await M.Teacher.find().populate('user', 'fullname email isActive').sort({ employeeId: 1 }).lean();
  const students = await M.Student.find().populate('user', 'fullname email isActive').sort({ admissionNo: 1 }).lean();
  const attendance = await M.Attendance.find({ isActive: true }).select('students').lean();
  const personalSummaries = [1, 2, 3].map(n => {
    const student = students.find(s => s.admissionNo === `DVS-S${String(n).padStart(3, '0')}`);
    return { email: student.user.email, ...summarizeAttendance(attendance.map(row => ({ students: row.students.filter(entry => String(entry.student) === String(student._id)) }))) };
  });
  const scenarios = [];
  for (const [scenario, id] of [['Locked', manifest.samples.locked], ['Teacher 1 unlocked', manifest.samples.teacher1Unlocked], ['Deactivated', manifest.samples.inactive]]) {
    const row = await M.Attendance.findById(id).populate('period', 'name startTime endTime').populate({ path: 'teacherAssignment', populate: [{ path: 'schoolClass', select: 'name' }, { path: 'section', select: 'name' }, { path: 'subject', select: 'name' }, { path: 'teacher', select: 'user', populate: { path: 'user', select: 'email' } }] }).lean();
    const a = row.teacherAssignment;
    scenarios.push({ scenario, id: String(row._id), date: row.attendanceDate.toISOString().slice(0, 10), section: `${a.schoolClass.name} ${a.section.name}`, subject: a.subject.name, teacher: a.teacher.user.email, period: `${row.period.name} ${row.period.startTime}–${row.period.endTime}` });
  }
  const catalog = { school: manifest.school, seedDate: manifest.seedDate, timeZone: manifest.timeZone, randomSeed: manifest.randomSeed, attendanceDates: manifest.attendanceDates, counts: manifest.counts, samples: manifest.samples, unmarked: manifest.unmarked, verification, teachers: teachers.map(t => ({ employeeId: t.employeeId, name: t.user.fullname, email: t.user.email, isActive: t.isActive })), students: students.map(s => ({ admissionNo: s.admissionNo, name: s.user.fullname, email: s.user.email, placement: sectionLabel(studentSection(Number(s.admissionNo.slice(-3)))), roll: s.rollNumber, isActive: s.isActive })) };
  catalog.personalSummaries = personalSummaries;
  catalog.scenarios = scenarios;
  await fs.mkdir(path.join(root, 'demo-data'), { recursive: true });
  await fs.writeFile(path.join(root, 'demo-data/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  const lines = [
    '# Demo Vidya School — reusable dummy-data report', '',
    '> Every person, address, contact and financial record in this report is fictional. Use only for local development. Real application branding is unchanged.', '',
    `Seed school date: **${manifest.seedDate}**. Timezone: **${manifest.timeZone}**. Reproducible random seed: **${manifest.randomSeed}**.`,
    `Attendance window: **${manifest.attendanceDates[0]} through ${manifest.attendanceDates.at(-1)}**, ${manifest.attendanceDates.length} completed Monday–Saturday working days. All lessons on the seed date are initially unmarked.`, '',
    '## Login accounts', '',
    manifest.defaultPassword ? 'Development-only password for all seeded accounts: **DemoSchool123!**. Never use it for the real school.' : 'A custom DEMO_PASSWORD was used. It is intentionally omitted from this report. Use the value supplied when seeding.', '',
    '| Account | Use |', '| --- | --- |',
    '| admin@demo.example.test | All Admin screens, setup, timetable and attendance review |',
    '| teacher1@demo.example.test | Class 6 A English, Class 10 B Mathematics, Class 10 A Science |',
    '| teacher2@demo.example.test | Class 6 B English, Class 6 A Mathematics, Class 10 B Science |',
    '| student1@demo.example.test | Class 6 A, roll 1; high-attendance profile |',
    '| student2@demo.example.test | Class 6 B, roll 1; medium-attendance profile |',
    '| student3@demo.example.test | Class 7 A, roll 1; low-attendance profile |',
    '| student249@demo.example.test | Inactive: Class 10 A, roll 25; login must fail |',
    '| student250@demo.example.test | Inactive: Class 10 B, roll 25; login must fail |', '',
    '## Generated counts', '', '| Model | Count |', '| --- | ---: |',
    ...Object.entries(manifest.counts).map(([name, count]) => `| ${name} | ${count} |`), '',
    '250 Student profiles include 248 active and 2 inactive profiles/accounts. Every section has 25 profiles; Class 10 A/B each have 24 currently eligible roster members. All 20 teachers and the main demo accounts are active. Only active students receive fee assignments and attendance entries.', '',
    '## Timetable reference', '',
    'Monday–Saturday: 09:00–09:45, 09:45–10:30, break 10:30–10:50, 10:50–11:35, 11:35–12:20, 12:20–13:05. Every section has five lessons per working day, 30 per week. Rooms are DVS-6A through DVS-10B. Sunday has no lessons; no fake Sunday task is generated.', '',
    '| Day | Period 1 | Period 2 | Period 3 | Period 4 | Period 5 |', '| --- | --- | --- | --- | --- | --- |',
    ...weekdays.map((day, d) => `| ${day} | ${Array.from({ length: 5 }, (_, p) => subjects[(d + p) % 6]).join(' | ')} |`), '',
    '## Section and teacher assignments', '', '| Section | Class teacher / English | Mathematics | Science | Social Science | Hindi | Computer Studies |', '| --- | --- | --- | --- | --- | --- | --- |',
    ...Array.from({ length: 10 }, (_, s) => `| ${sectionLabel(s)} | ${subjects.map((_, j) => `teacher${teacherFor(s, j)}`).join(' | ')} |`), '',
    '## Attendance test cases', '',
    '| Scenario | School date | Class / section | Subject | Period | Owning teacher |', '| --- | --- | --- | --- | --- | --- |',
    ...scenarios.map(s => `| ${s.scenario} | ${s.date} | ${s.section} | ${s.subject} | ${s.period} | ${s.teacher} |`), '',
    'Use these dates and assignments in Attendance history filters. The IDs below also work in the demo frontend URL `/admin/attendance?record=ID` (Admin) or `/teacher/attendance?record=ID` (owning Teacher only).', '',
    `- Locked session ID: ${manifest.samples.locked}. Admin can unlock with a reason; Teacher edits must fail while locked.`,
    `- Teacher 1 unlocked session ID: ${manifest.samples.teacher1Unlocked}. Open Teacher history and edit this session; concurrent/stale saves must fail with 409.`,
    `- Deactivated session ID: ${manifest.samples.inactive}. Find it using Admin Inactive filter. No attendance restore operation exists; its unique key stays reserved.`,
    `- ${manifest.unmarked.length} completed timetable sessions are intentionally missing. They are not Absent and are not included in any percentage denominator.`,
    '- For a fresh marking test, Teacher 1 opens a task on the seed date, or chooses their Class 6 A English assignment and an eligible teaching period on that date. Student 1 should then see their recorded entry. Student 2 must not see Student 1’s status.',
    '- Bulk actions start from Unmarked. Only Present contributes to the numerator; all five recorded statuses count in the denominator.',
    '- Existing attendance retains the original roster. No prior-year enrollment is fabricated; prior year contains setup/calendar only.', '',
    '| Status | Active recorded student-period entries |', '| --- | ---: |',
    ...['present', 'absent', 'late', 'halfDay', 'leave', 'total'].map(key => `| ${key} | ${verification.attendance[key]} |`), '',
    '### Personal percentage checks', '',
    'Fresh-seed totals across all active history. Clear date/subject/status filters to compare. Legitimate manual marking will change these numbers.', '',
    '| Login | Present | Recorded periods | Present-only percentage |', '| --- | ---: | ---: | ---: |',
    ...personalSummaries.map(s => `| ${s.email} | ${s.present} | ${s.total} | ${s.attendancePercentage}% |`), '',
    '## Finance exercises', '',
    '- Student 1: annual fee fully paid; Student 2: partially paid; Student 3: pending; Student 4: payment reversed, balance pending again.',
    '- Teacher 1: salary fully paid; Teacher 2: partially paid; Teacher 3: pending; Teacher 4: salary payment reversed.',
    '- Payments are fictional Cash entries with deterministic idempotency keys. No bank/card credentials or payment gateway are involved.', '',
    '| Ledger | Net paid | Outstanding | Pending | Partial | Paid | Reversed payments |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...Object.entries(verification.finance).map(([kind, f]) => `| ${kind} | ${f.paid} | ${f.remaining} | ${f.pending} | ${f.partial} | ${f.fullyPaid} | ${f.reversedPayments} |`), '',
    '## Verification and future reuse', '',
    `Last API verification: **${verification.verifiedAt}** (UTC). Seed date remains **${manifest.seedDate}**; verification does not reseed or change it.`, '',
    `${verification.apiChecks} demo API checks passed. Timetable interval conflicts: 0. Foreign references, role isolation, roster eligibility, locked updates, duplicate rejection, personal percentages, notice visibility and payment/reversal balances passed. Repeated seed preserved all stored documents: ${verification.repeatedSeedPreservesAllDocuments}.`,
    'Browser acceptance: **unverified**. Follow DEMO_DATA_GUIDE.md for startup and manual UI checks. A normal seed rerun is a no-op after completion; it does not refresh dates, reset passwords or overwrite manual testing. Explicit reset is the only rebuild path.',
    'This is a snapshot at seed verification. Today’s tasks use the actual school date, and future/expired notices naturally change visibility over time. Reset with a current seed date for a fresh current-day demo, or use the recorded dates in filters.', '',
    '## Teacher directory', '', '| Employee ID | Fictional name | Login |', '| --- | --- | --- |',
    ...catalog.teachers.map(t => `| ${t.employeeId} | ${t.name} | ${t.email} |`), '',
    '## Complete student directory', '', '| Admission ID | Fictional name | Login | Class / section | Roll | State |', '| --- | --- | --- | --- | ---: | --- |',
    ...catalog.students.map(s => `| ${s.admissionNo} | ${s.name} | ${s.email} | ${s.placement} | ${s.roll} | ${s.isActive ? 'Active' : 'Inactive'} |`), '',
    'Machine-readable synthetic catalog: demo-data/catalog.json. It contains no passwords, hashes, tokens or database connection strings.', '',
  ];
  await fs.writeFile(path.join(root, 'DEMO_DATA_REPORT.md'), lines.join('\n'));
}
