import assert from 'node:assert/strict';
export async function verifyAdminManagement({ request, token, teacherToken, studentToken, password }) {
  const prefix = '/admin-management';
  for (const auth of [teacherToken, studentToken]) {
    await request('GET', `${prefix}/options`, null, auth, 403);
    for (const resource of ['academic-years', 'classes', 'sections', 'subjects', 'periods', 'teachers', 'teacher-assignments']) {
      await request('GET', `${prefix}/${resource}`, null, auth, 403);
      await request('POST', `/${resource}`, {}, auth, 403);
    }
    await request('GET', `${prefix}/classes/123456789012345678901234/dependencies`, null, auth, 403);
  }
  await request('GET', `${prefix}/options`, null, null, 401);
  await request('GET', `${prefix}/constructor`, null, token, 404);
  await request('GET', `${prefix}/classes?page=0`, null, token, 400);
  await request('GET', `${prefix}/classes?limit=101`, null, token, 400);
  await request('GET', `${prefix}/classes?academicYear=invalid`, null, token, 400);
  const year = await request('POST', '/academic-years', { name: 'Management 2026', startDate: '2026-04-01', endDate: '2027-03-31' }, token);
  const cls = await request('POST', '/classes', { name: 'Management Class', academicYear: year._id, description: 'Setup workflow' }, token);
  const section = await request('POST', '/sections', { name: 'A', schoolClass: cls._id, capacity: 35 }, token, 201);
  const subject = await request('POST', '/subjects', { name: 'Science', code: 'SCI', schoolClass: cls._id }, token, 201);
  const period = await request('POST', '/periods', { name: 'Management period', periodNumber: 8, startTime: '13:00', endTime: '14:00' }, token, 201);
  assert.equal((await request('GET', `${prefix}/periods?search=Management%20period`, null, token)).records[0].isScheduled, false);
  assert.equal((await request('GET', `${prefix}/academic-years?search=Management%202026`, null, token)).records[0].hasEnrollments, false);
  const teacher = await request('POST', '/teachers', { fullname: 'Management Teacher', email: 'management@example.test', password, phone: '9999999999', qualification: 'B.Ed', designation: 'Teacher', joiningDate: '2026-04-01', employeeType: 'Contract' }, token, 201);
  assert.ok(teacher.employeeId);
  const assignmentBody = { academicYear: year._id, schoolClass: cls._id, section: section._id, subject: subject._id, teacher: teacher._id, isClassTeacher: true, remarks: 'Management workflow' };
  const assignment = await request('POST', '/teacher-assignments', assignmentBody, token, 201);
  await request('PUT', `/academic-years/${year._id}`, { name: 'Management 2026 revised', startDate: '2026-04-01', endDate: '2027-03-31' }, token);
  await request('PUT', `/classes/${cls._id}`, { name: 'Managed Class', academicYear: year._id, description: 'Updated' }, token);
  await request('PUT', `/subjects/${subject._id}`, { name: 'General Science', code: 'SCI', schoolClass: cls._id }, token);
  await request('PUT', `/periods/${period._id}`, { name: 'Afternoon', periodNumber: 8, startTime: '13:00', endTime: '14:00', isBreak: false }, token);
  await request('PUT', `/teacher-assignments/${assignment._id}`, { ...assignmentBody, remarks: 'Updated' }, token);
  await request('PUT', `/teachers/${teacher._id}`, { fullname: 'Management Teacher', department: 'Science', phone: '8888888888' }, token);
  await request('POST', '/auth/login', { email: 'management@example.test', password });
  await request('PUT', `/teachers/${teacher._id}`, { phone: '' }, token);
  await request('POST', '/periods', { name: 'Invalid', periodNumber: 9, startTime: '14:00', endTime: '13:00' }, token, 400);
  const student = await request('POST', '/students', { fullname: 'Managed Student', email: 'managed-student@example.test', password, rollNumber: 1, schoolClass: cls._id, section: section._id, fatherName: 'Parent', motherName: 'Parent', dob: '2018-01-01', gender: 'Other', phone: '9999999999' }, token, 201);
  assert.equal(student.schoolClass._id || student.schoolClass, cls._id);
  const managedClass = (await request('GET', `${prefix}/classes?academicYear=${year._id}`, null, token)).records.find(record => record._id === cls._id);
  assert.equal(managedClass.sectionCount, 1); assert.equal(managedClass.studentCount, 1);
  assert.equal((await request('GET', `${prefix}/academic-years?search=Management%202026`, null, token)).records[0].hasEnrollments, true);
  const booking = await request('POST', '/timetables', { academicYear: year._id, teacherAssignment: assignment._id, period: period._id, day: 'Friday', roomNumber: 'Management fixture room' }, token, 201);
  assert.equal((await request('GET', `${prefix}/periods?search=Afternoon`, null, token)).records[0].isScheduled, true);
  await request('DELETE', `/timetables/${booking._id}`, null, token);
  assert.equal((await request('GET', `${prefix}/periods?search=Afternoon`, null, token)).records[0].isScheduled, true, 'Inactive timetable history still reserves period timing');
  await request('POST', '/teacher-assignments', assignmentBody, token, 400);
  const anotherSubject = await request('POST', '/subjects', { name: 'Language', code: 'LANG', schoolClass: cls._id }, token, 201);
  const conflict = await request('POST', '/teacher-assignments', { ...assignmentBody, subject: anotherSubject._id }, token, 400);
  assert.match(conflict.message, /class teacher/i);
  await request('PUT', `/sections/${section._id}`, { name: 'A', schoolClass: cls._id, classTeacher: teacher._id }, token);
  let sections = await request('GET', `${prefix}/sections?academicYear=${year._id}&schoolClass=${cls._id}`, null, token);
  assert.equal(sections.records[0].classTeacher.user.fullname, 'Management Teacher');
  await request('PUT', `/sections/${section._id}`, { name: 'A', schoolClass: cls._id, classTeacher: null }, token);
  sections = await request('GET', `${prefix}/sections?schoolClass=${cls._id}`, null, token);
  assert.equal(sections.records[0].classTeacher, null);
  await request('PATCH', `/academic-years/${year._id}/current`, {}, token);
  assert.equal((await request('GET', `${prefix}/academic-years`, null, token)).records.filter(y => y.isCurrent).length, 1);
  const dependencies = await request('GET', `${prefix}/classes/${cls._id}/dependencies`, null, token);
  assert.equal(dependencies.sections.total, 1); assert.equal(dependencies.subjects.total, 2); assert.equal(dependencies.assignments.active, 1); assert.equal(dependencies.students.active, 1);
  const teachers = await request('GET', `${prefix}/teachers?search=management@example.test`, null, token);
  assert.equal(teachers.records.length, 1); assert.equal(teachers.records[0].salary, undefined); assert.equal(teachers.records[0].user.password, undefined);
  const assignments = await request('GET', `${prefix}/teacher-assignments?academicYear=${year._id}&schoolClass=${cls._id}&section=${section._id}&teacher=${teacher._id}`, null, token);
  assert.equal(assignments.pagination.total, 1); assert.equal(assignments.records[0].subject.name, 'General Science');
  assert.equal((await request('GET', `${prefix}/teacher-assignments?subject=${subject._id}`, null, token)).pagination.total, 1);
  assert.equal((await request('GET', `${prefix}/teacher-assignments?subject=${anotherSubject._id}`, null, token)).pagination.total, 0);
  await request('GET', `${prefix}/teacher-assignments?subject=invalid`, null, token, 400);
  await request('GET', `${prefix}/teacher-assignments?subject[$ne]=invalid`, null, token, 400);
  const page = await request('GET', `${prefix}/subjects?schoolClass=${cls._id}&page=99&limit=1`, null, token);
  assert.equal(page.pagination.page, 2); assert.equal(page.records.length, 1);
  assert.equal((await request('GET', `${prefix}/subjects?search=%5B`, null, token)).records.length, 0);
  for (const [route, record] of [['teacher-assignments', assignment], ['periods', period], ['subjects', subject], ['sections', section], ['teachers', teacher]]) {
    await request('DELETE', `/${route}/${record._id}`, null, token);
    const inactive = await request('GET', `${prefix}/${route}?status=inactive`, null, token);
    assert.ok(inactive.records.some(r => r._id === record._id));
    await request('PATCH', `/${route}/${record._id}/restore`, {}, token);
  }
  await request('DELETE', `/classes/${cls._id}`, null, token);
  let options = await request('GET', `${prefix}/options`, null, token);
  assert.equal(options.classes.find(c => c._id === cls._id).eligible, false);
  assert.equal(options.subjects.find(s => s._id === subject._id).eligible, false);
  assert.equal(options.sections.find(s => s._id === section._id).eligible, false);
  assert.deepEqual(Object.keys(options.teachers.find(t => t._id === teacher._id)).sort(), ['_id', 'eligible', 'employeeId', 'isActive', 'name']);
  await request('PATCH', `/classes/${cls._id}/restore`, {}, token);
  await request('DELETE', `/academic-years/${year._id}`, null, token);
  options = await request('GET', `${prefix}/options`, null, token);
  assert.equal(options.years.find(y => y._id === year._id).isCurrent, false);
  assert.equal(options.classes.find(c => c._id === cls._id).eligible, false);
  await request('PATCH', `/academic-years/${year._id}`, {}, token);
  options = await request('GET', `${prefix}/options`, null, token);
  assert.equal(options.classes.find(c => c._id === cls._id).eligible, true);
  for (const route of ['academic-years', 'classes', 'sections', 'subjects', 'periods', 'teachers', 'teacher-assignments']) {
    const list = await request('GET', `${prefix}/${route}?status=all`, null, token);
    assert.ok(list.records.length); assert.ok(list.pagination.total >= list.records.length);
  }
}
