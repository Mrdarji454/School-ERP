import test from 'node:test';
import assert from 'node:assert/strict';
import { personValues, personPayload } from '../src/config/people.js';
test('profile payloads keep credentials creation-only and exclude controlled unrelated fields', () => {
  const values = { ...personValues('teachers'), fullname: 'Teacher', email: 'teacher@example.test', password: 'InitialPass123!', role: 'Admin', salary: 999, employeeId: 'FORGED' };
  const created = personPayload('teachers', values, false), edited = personPayload('teachers', values, true);
  assert.equal(created.password, values.password); assert.equal(edited.password, undefined);
  for (const key of ['role', 'salary', 'employeeId', 'academicYear']) assert.equal(edited[key], undefined);
  assert.equal(edited.accountActive, true); assert.equal(edited.isActive, true);
});
test('student form restores scoped placement and new optional fields without inventing enrollment history', () => {
  const row = { admissionNo: 'ADM1', user: { fullname: 'Student', email: 's@example.test', isActive: false }, schoolClass: { _id: 'class', academicYear: { _id: 'year' } }, section: { _id: 'section' }, rollNumber: 1, dob: '2015-01-01T00:00:00Z', guardianName: 'Parent', isActive: true };
  const values = personValues('students', row), payload = personPayload('students', values, true);
  assert.equal(values.academicYear, 'year'); assert.equal(payload.schoolClass, 'class'); assert.equal(payload.guardianName, 'Parent'); assert.equal(payload.accountActive, false);
  assert.equal(payload.admissionNo, undefined); assert.equal(payload.password, undefined); assert.equal(payload.dob, '2015-01-01');
});
