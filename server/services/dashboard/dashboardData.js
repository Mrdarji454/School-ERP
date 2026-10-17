import AcademicYear from "../../models/AcademicYear.js";
import SchoolClass from "../../models/SchoolClass.js";
import Subject from "../../models/Subject.js";
import Student from "../../models/Student.js";
import Teacher from "../../models/Teacher.js";
import TeacherAssignment from "../../models/TeacherAssignment.js";
import Attendance from "../../models/Attendance.js";
import Timetable from "../../models/TimeTable.js";
import FeeStructure from "../../models/FeeStructure.js";
import StudentFee from "../../models/StudentFee.js";
import FeePayment from "../../models/FeePayment.js";
import TeacherSalary from "../../models/TeacherSalary.js";
import AcademicCalendar from "../../models/AcademicCalendar.js";
import { schoolToday } from "../../utils/schoolDate.js";
import { getNotifications } from "./getNotifications.js";
import { fail } from "../../utils/errors.js";
import { currentStudentIds } from '../enrollmentPlacement.js';
export function summarizeAttendance(records) {
  const counts = { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0 };
  const keys = { Present: "present", Absent: "absent", Late: "late", "Half Day": "halfDay", Leave: "leave" };
  for (const row of records) for (const entry of row.students) if (keys[entry.status]) counts[keys[entry.status]]++;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { ...counts, total, attendancePercentage: total ? Number((counts.present / total * 100).toFixed(2)) : 0, unit: "student-period", policy: "Present-only numerator; all recorded statuses in denominator" };
}
export async function dashboardData(yearId) {
  const year = await AcademicYear.findOne(yearId ? { _id: yearId, isActive: true } : { isCurrent: true, isActive: true });
  if (!year) fail(409, "Select an active current academic year before viewing the dashboard");
  const today = schoolToday(), now = new Date();
  const classes = await SchoolClass.find({ academicYear: year._id, isActive: true }).distinct("_id");
  const assignments = await TeacherAssignment.find({ academicYear: year._id, schoolClass: { $in: classes }, isActive: true });
  const assignmentIds = assignments.map(a => a._id), teacherIds = assignments.map(a => a.teacher);
  const studentScope = { _id: { $in: await currentStudentIds({ schoolClass: { $in: classes } }) }, isActive: true };
  const structures = await FeeStructure.find({ academicYear: year._id }).distinct("_id");
  const feeIds = await StudentFee.find({ feeStructure: { $in: structures } }).distinct("_id");
  const salaryPeriod = { $or: Array.from({ length: 12 * (year.endDate.getUTCFullYear() - year.startDate.getUTCFullYear() + 1) }, (_, i) => ({ year: year.startDate.getUTCFullYear() + Math.floor(i / 12), month: i % 12 + 1 })).filter(p => new Date(Date.UTC(p.year, p.month, 0)) >= year.startDate && new Date(Date.UTC(p.year, p.month - 1, 1)) <= year.endDate) };
  const [totalStudents, totalTeachers, totalSubjects, attendance, todayTimetable, upcomingEvents, recentStudents, recentTeachers, pendingFees, pendingSalaries, notifications, collected, recentPayments] = await Promise.all([
    Student.countDocuments(studentScope), Teacher.countDocuments({ _id: { $in: teacherIds }, isActive: true }), Subject.countDocuments({ schoolClass: { $in: classes }, isActive: true }),
    Attendance.find({ isActive: true, attendanceDate: today, teacherAssignment: { $in: assignmentIds } }),
    Timetable.find({ isActive: true, academicYear: year._id, teacherAssignment: { $in: assignmentIds }, day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getUTCDay()] }).populate("period").populate("teacherAssignment"),
    AcademicCalendar.find({ academicYear: year._id, isActive: true, endDate: { $gte: today } }).sort({ startDate: 1 }).limit(5),
    Student.find(studentScope).populate("user", "fullname email").populate("schoolClass", "name").sort({ createdAt: -1 }).limit(5),
    Teacher.find({ _id: { $in: teacherIds }, isActive: true }).populate("user", "fullname email").sort({ createdAt: -1 }).limit(5),
    StudentFee.find({ feeStructure: { $in: structures }, isActive: true, remainingAmount: { $gt: 0 } }).populate({ path: "student", populate: { path: "user", select: "fullname" } }).limit(5),
    TeacherSalary.find({ ...salaryPeriod, isActive: true, remainingAmount: { $gt: 0 } }).populate({ path: "teacher", populate: { path: "user", select: "fullname" } }).limit(5),
    getNotifications(now),
    FeePayment.aggregate([{ $match: { studentFee: { $in: feeIds }, isReversed: { $ne: true } } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]),
    FeePayment.find({ studentFee: { $in: feeIds }, isReversed: { $ne: true } }).sort({ paymentDate: -1 }).limit(5),
  ]);
  return { statistics: { totalStudents, totalTeachers, totalSubjects, totalClasses: classes.length, feesCollected: collected[0]?.amount || 0, currentAcademicYear: year }, attendance: summarizeAttendance(attendance), todayTimetable: todayTimetable.filter(t => t.period?.isActive).sort((a, b) => a.period.startTime.localeCompare(b.period.startTime)), upcomingEvents, recentStudents, recentTeachers, pendingFees, pendingSalaries, notifications, recentPayments };
}
