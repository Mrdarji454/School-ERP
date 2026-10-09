import test from 'node:test';
import assert from 'node:assert/strict';
import { rosterRows, attendancePayload, filterAssignments, todayLessons, validSchoolDateRange } from '../src/utils/workflow.js';
test('attendance date ranges accept open or ordered dates and reject reversed ranges', () => {
  assert.equal(validSchoolDateRange('', ''), true);
  assert.equal(validSchoolDateRange('2026-10-01', ''), true);
  assert.equal(validSchoolDateRange('', '2026-10-31'), true);
  assert.equal(validSchoolDateRange('2026-10-01', '2026-10-31'), true);
  assert.equal(validSchoolDateRange('2026-10-31', '2026-10-01'), false);
});
test('new roster is Unmarked and never serializes an implicit attendance status', () => {
  const rows = rosterRows([{ _id: 'one' }, { _id: 'two' }], null);
  assert.deepEqual(rows.map(r => r.status), ['', '']);
  assert.throws(() => attendancePayload(rows), /every student/);
  const marked = rows.map(r => ({ ...r, status: 'Present' }));
  assert.deepEqual(attendancePayload(marked), [{ student: 'one', status: 'Present', remark: '' }, { student: 'two', status: 'Present', remark: '' }]);
  assert.deepEqual(rows.map(r => r.status), ['', ''], 'Payload building must not mutate pending form input');
});
test('existing attendance uses recorded roster rather than fabricating historical enrollment', () => {
  const existing = { students: [{ student: { _id: 'historical' }, status: 'Half Day', remark: 'Saved' }] };
  const rows = rosterRows([{ _id: 'new-enrollment' }], existing);
  assert.equal(rows.length, 1); assert.equal(rows[0].student._id, 'historical');
  assert.equal(attendancePayload(rows)[0].status, 'Half Day');
  assert.throws(() => attendancePayload([{ student: null, status: 'Present', remark: '' }]), /missing/);
});
test('academic selection excludes inactive and unrelated assignments', () => {
  const assignments = [{ _id: 'a', eligible: true, schoolClass: { _id: 'class-a' } }, { _id: 'b', eligible: false, schoolClass: { _id: 'class-a' } }, { _id: 'c', eligible: true, schoolClass: { _id: 'class-b' } }];
  assert.deepEqual(filterAssignments(assignments, { schoolClass: 'class-a' }, true).map(a => a._id), ['a']);
});
test('today tasks require a matching weekday and applicable academic year', () => {
  const options = { today: '2026-10-09', day: 'Friday', assignments: [{ _id: 'active', eligible: true, academicYear: { startDate: '2026-04-01', endDate: '2027-03-31' } }, { _id: 'old', eligible: true, academicYear: { startDate: '2025-04-01', endDate: '2026-03-31' } }] };
  const rows = [{ _id: 'one', day: 'Friday', teacherAssignment: { _id: 'active' } }, { _id: 'two', day: 'Thursday', teacherAssignment: { _id: 'active' } }, { _id: 'three', day: 'Friday', teacherAssignment: { _id: 'old' } }];
  assert.deepEqual(todayLessons(rows, options).map(r => r._id), ['one']);
});
