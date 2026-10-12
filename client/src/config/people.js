const f = (name, label, type = 'text', required = false) => ({ name, label, type, required });
export const studentGroups = [
  ['Account', [f('fullname', 'Full name', 'text', true), f('email', 'Email / login identifier', 'email', true), f('accountActive', 'Account status', 'status')]],
  ['Personal', [f('dob', 'Date of birth', 'date', true), f('gender', 'Gender', 'gender', true), f('phone', 'Phone'), f('address', 'Address'), f('bloodGroup', 'Blood group')]],
  ['Guardian', [f('fatherName', 'Father name'), f('motherName', 'Mother name'), f('guardianName', 'Primary guardian name'), f('guardianRelationship', 'Guardian relationship'), f('guardianPhone', 'Guardian contact'), f('additionalGuardianPhone', 'Additional guardian contact')]],
  ['Academic placement', [f('academicYear', 'Academic year', 'year', true), f('schoolClass', 'Class', 'class', true), f('section', 'Section', 'section', true), f('rollNumber', 'Roll number', 'number', true), f('admissionDate', 'Admission date', 'date'), f('isActive', 'Enrollment status', 'status')]],
];
export const teacherGroups = [
  ['Account', [f('fullname', 'Full name', 'text', true), f('email', 'Email / login identifier', 'email', true), f('accountActive', 'Account status', 'status')]],
  ['Personal / contact', [f('phone', 'Phone'), f('address', 'Address'), f('dob', 'Date of birth', 'date'), f('emergencyContact', 'Emergency contact')]],
  ['Employment', [f('qualification', 'Qualification', 'text', true), f('experience', 'Experience (years)', 'number'), f('designation', 'Designation', 'text', true), f('department', 'Department'), f('joiningDate', 'Joining date', 'date', true), f('employeeType', 'Employment type', 'employment', true), f('isActive', 'Profile status', 'status')]],
];
export const groupsFor = kind => kind === 'students' ? studentGroups : teacherGroups;
export const personIdentifier = kind => kind === 'students' ? 'admissionNo' : 'employeeId';
export function personValues(kind, row) {
  const values = Object.fromEntries(groupsFor(kind).flatMap(([, fields]) => fields.map(f => [f.name, f.type === 'date' ? row?.[f.name]?.slice(0, 10) || '' : row?.[f.name] ?? ''])));
  return { ...values, fullname: row?.user?.fullname || '', email: row?.user?.email || '', phone: row?.user?.phone || row?.phone || '', academicYear: row?.schoolClass?.academicYear?._id || '', schoolClass: row?.schoolClass?._id || '', section: row?.section?._id || '', accountActive: String(row?.user?.isActive ?? true), isActive: String(row?.isActive ?? true), employeeType: row?.employeeType || 'Permanent', experience: row?.experience ?? 0, password: '' };
}
export function personPayload(kind, values, editing) {
  const data = Object.fromEntries(groupsFor(kind).flatMap(([, fields]) => fields.filter(f => f.name !== 'academicYear').map(f => [f.name, f.type === 'status' ? values[f.name] === 'true' : f.type === 'number' ? Number(values[f.name]) : values[f.name]])));
  if (!editing) data.password = values.password;
  return data;
}
