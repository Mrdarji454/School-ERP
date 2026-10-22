import test from 'node:test';
import assert from 'node:assert/strict';
import { academicColumns, changeAcademicFilter, initialAcademicFilters, isAcademicPath, lockedAcademicField } from '../src/utils/academicPresentation.js';

test('academic filter changes reset dependent section/subject and pagination without losing independent filters', () => {
  const filters = { ...initialAcademicFilters(), schoolClass: 'old', section: 'a', subject: 'math', teacher: 't', search: 'Meera', page: 4 };
  assert.deepEqual(changeAcademicFilter(filters, 'schoolClass', 'new'), { ...filters, schoolClass: 'new', section: '', subject: '', page: 1 });
  assert.equal(changeAcademicFilter(filters, 'status', 'inactive').subject, 'math');
});
test('edit locks preserve scheduled and enrollment history while allowing other edits', () => {
  for (const name of ['startTime', 'endTime', 'isBreak']) assert.equal(lockedAcademicField('periods', { isScheduled: true }, { name }), true);
  assert.equal(lockedAcademicField('periods', { isScheduled: true }, { name: 'description' }), false);
  assert.equal(lockedAcademicField('periods', { isScheduled: false }, { name: 'startTime' }), false);
  assert.equal(lockedAcademicField('academic-years', { hasEnrollments: true }, { name: 'startDate' }), true);
  assert.equal(lockedAcademicField('classes', {}, { name: 'academicYear', immutable: true }), true);
  assert.equal(lockedAcademicField('classes', null, { name: 'academicYear', immutable: true }), false);
});
test('real zero counts and missing historical references stay honest in both responsive presentations', () => {
  const columns = academicColumns('classes');
  assert.equal(columns.find(c => c.header === 'Active students').value({ studentCount: 0 }), 0);
  assert.equal(columns.find(c => c.header === 'Active students').value({}), '—');
  assert.match(academicColumns('teacher-assignments')[1].value({}), /Missing reference/);
  assert.equal(isAcademicPath('/admin/periods'), true);
  assert.equal(isAcademicPath('/teacher/periods'), false);
  assert.equal(isAcademicPath('/admin/students'), false);
});
