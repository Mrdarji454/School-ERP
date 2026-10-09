export function duplicateMessage(error) {
  const keys = Object.keys(error.keyPattern || {});
  if (keys.includes('teacherAssignment') && keys.includes('attendanceDate')) return 'Attendance already exists for this assignment, date and period, including inactive history. Reload the existing session.';
  if (keys.includes('teacherAssignment') && keys.includes('day')) return 'This timetable booking already exists, including inactive bookings. Restore the existing booking instead.';
  if (keys.includes("email")) return "Email already exists, including inactive accounts. Use a different email or restore the existing profile.";
  if (keys.includes("code") && keys.includes("schoolClass")) return "Subject code already exists in this class, including inactive subjects. Restore the existing subject or use another code.";
  if (keys.includes("periodNumber")) return "Period number already exists, including inactive periods. Restore that period or choose another number.";
  if (keys.includes("schoolClass") && keys.includes("section") && keys.includes("academicYear") && !keys.includes("teacher")) return "This section already has an active class-teacher assignment. Remove that role from the existing assignment first.";
  if (keys.includes("teacher") && keys.includes("subject")) return "This teacher assignment already exists, including inactive assignments. Restore the existing assignment instead.";
  return "A record with these unique fields already exists";
}
