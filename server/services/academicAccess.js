import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import { classSection, eligibleAssignment } from '../utils/relationships.js';
export async function eligibleAssignments(user) {
  const teacher = await Teacher.findOne({ user: user._id, isActive: true });
  if (!teacher) return [];
  const candidates = await TeacherAssignment.find({ teacher: teacher._id, isActive: true });
  const rows = [];
  for (const row of candidates) {
    try { await eligibleAssignment(row._id, user); rows.push(row); }
    catch (error) { if (![400, 403].includes(error.status)) throw error; }
  }
  return rows;
}
export async function audienceScope(user) {
  if (user.role === 'Teacher') {
    const assignments = await eligibleAssignments(user);
    return { years: assignments.map(a => a.academicYear), classes: assignments.map(a => a.schoolClass), sections: assignments.map(a => a.section), assignments };
  }
  if (user.role === 'Student') {
    const student = await Student.findOne({ user: user._id, isActive: true });
    if (student) try { const cls = await classSection(student.schoolClass, student.section); return { years: [cls.academicYear], classes: [cls._id], sections: [student.section], student }; } catch (e) { if (e.status !== 400) throw e; }
  }
  return { years: [], classes: [], sections: [] };
}
