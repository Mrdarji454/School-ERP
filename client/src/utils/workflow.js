export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const attendanceStatuses = ['Present', 'Absent', 'Late', 'Half Day', 'Leave'];
export const idOf = value => value?._id || value || '';
export const label = value => value?.name ? `${value.name}${value.isActive === false ? ' (inactive)' : ''}` : 'Missing reference';
export const assignmentLabel = a => a ? `${label(a.schoolClass)} / ${label(a.section)} · ${label(a.subject)} · ${a.teacher?.user?.fullname || 'Missing teacher'}${a.isActive === false ? ' (inactive assignment)' : ''}` : 'Missing assignment';
export const timeLabel = p => p ? `${p.name} (${p.startTime}–${p.endTime})${p.isBreak ? ' · Break' : ''}${p.isActive === false ? ' · Inactive' : ''}` : 'Missing period';
export function uniqueReferences(assignments, field) {
  return [...new Map(assignments.filter(a => a[field]?._id).map(a => [a[field]._id, a[field]])).values()];
}
export function filterAssignments(assignments, filters, eligibleOnly = false) {
  return assignments.filter(a => (!eligibleOnly || a.eligible) && ['academicYear', 'schoolClass', 'section', 'teacher'].every(key => !filters[key] || idOf(a[key]) === filters[key]));
}
export function attendancePayload(rows) {
  if (!rows.length) throw new Error('No eligible students in this roster');
  if (rows.some(row => !attendanceStatuses.includes(row.status))) throw new Error('Select a status for every student. Unmarked rows cannot be saved.');
  if (rows.some(row => !row.student?._id)) throw new Error('A historical student reference is missing; this record cannot be edited.');
  if (rows.some(row => row.remark.length > 500)) throw new Error('Remarks must be 500 characters or fewer');
  return rows.map(row => ({ student: row.student._id, status: row.status, remark: row.remark }));
}
export const rosterRows = (roster, record) => record ? record.students.map(row => ({ student: row.student, status: row.status, remark: row.remark || '' })) : roster.map(student => ({ student, status: '', remark: '' }));
export function todayLessons(records, options) {
  return records.filter(row => row.day === options.day && options.assignments.some(a => a._id === idOf(row.teacherAssignment) && a.eligible && a.academicYear.startDate.slice(0, 10) <= options.today && a.academicYear.endDate.slice(0, 10) >= options.today));
}
