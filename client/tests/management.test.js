import test from 'node:test';
import assert from 'node:assert/strict';
import { managementSchema } from '../src/validations/managementSchemas.js';
import { initialManagementValues, managementPayload, optionsFor, dependentChanges, optionLabel } from '../src/utils/management.js';
const id = '123456789012345678901234';
test('academic dates and period ordering reject impossible values', () => {
  const year = managementSchema('academic-years');
  assert.equal(year.safeParse({ name: 'Year', startDate: '2026-02-30', endDate: '2027-03-01' }).success, false);
  assert.equal(year.safeParse({ name: 'Year', startDate: '2027-03-01', endDate: '2026-03-01' }).success, false);
  const period = { name: 'First', periodNumber: '1', startTime: '09:00', endTime: '10:00', isBreak: false, description: '' };
  assert.equal(managementSchema('periods').parse(period).periodNumber, 1);
  assert.equal(managementSchema('periods').safeParse({ ...period, endTime: '08:00' }).success, false);
});
test('teacher creation requires credentials while edits strip password and payroll fields', () => {
  const values = { ...initialManagementValues('teachers'), fullname: 'Teacher', email: 'TEACHER@example.test', qualification: 'B.Ed', designation: 'Teacher', joiningDate: '2026-04-01', salary: 999, password: 'InitialPassword123!' };
  const create = managementSchema('teachers', false).parse(values);
  assert.equal(create.email, 'teacher@example.test');
  assert.equal(managementPayload('teachers', create).password, values.password);
  assert.equal(managementSchema('teachers', false).safeParse({ ...values, password: '' }).success, false);
  const edit = managementPayload('teachers', managementSchema('teachers', true).parse(values));
  assert.equal(Object.hasOwn(edit, 'password'), false);
  assert.equal(Object.hasOwn(edit, 'salary'), false);
});
test('new dependent selections exclude inactive and unrelated records', () => {
  const options = { classes: [{ _id: 'a', academicYear: id, eligible: true }, { _id: 'b', academicYear: id, eligible: false }, { _id: 'c', academicYear: 'other', eligible: true }], sections: [{ _id: 'd', schoolClass: 'a', eligible: true }, { _id: 'e', schoolClass: 'c', eligible: true }] };
  assert.deepEqual(optionsFor({ options: 'classes' }, options, { academicYear: id }).map(v => v._id), ['a']);
  assert.deepEqual(optionsFor({ options: 'sections' }, options, { schoolClass: 'a' }).map(v => v._id), ['d']);
  assert.deepEqual(dependentChanges('academicYear', id), { academicYear: id, schoolClass: '', section: '', subject: '' });
  assert.deepEqual(dependentChanges('schoolClass', 'a'), { schoolClass: 'a', section: '', subject: '' });
});
test('historical relationships retain IDs and names without sending derived year', () => {
  const values = initialManagementValues('sections', { name: 'A', schoolClass: { _id: id, academicYear: { _id: id } }, capacity: 40, classTeacher: null });
  assert.equal(values.schoolClass, id);
  assert.equal(values.academicYear, id);
  const payload = managementPayload('sections', values);
  assert.equal(payload.classTeacher, null);
  assert.equal(Object.hasOwn(payload, 'academicYear'), false);
  assert.match(optionLabel({ name: 'Historical class', eligible: false }), /Historical class.*Inactive/);
});
