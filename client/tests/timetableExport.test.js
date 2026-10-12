import test from 'node:test';
import assert from 'node:assert/strict';
import { timetableCsv } from '../src/utils/timetableExport.js';

const selection = { academicYear: 'year', schoolClass: 'class', section: 'a' };
const booking = (overrides = {}) => ({ isActive: true, day: 'Monday', academicYear: { _id: 'year', name: '2026-27' }, period: { name: 'Period 1', startTime: '09:00', endTime: '09:45' }, teacherAssignment: { schoolClass: { _id: 'class', name: 'Class 6' }, section: { _id: 'a', name: 'A' }, subject: { name: 'English' }, teacher: { user: { fullname: 'Demo Teacher' } } }, roomNumber: '101', ...overrides });

test('export keeps only the selected active class, section and year and orders the week', () => {
  const otherSection = booking(); otherSection.teacherAssignment.section = { _id: 'b', name: 'B' };
  const otherClass = booking(); otherClass.teacherAssignment.schoolClass = { _id: 'other', name: 'Class 7' };
  const result = timetableCsv([booking({ day: 'Tuesday' }), otherSection, otherClass, booking({ isActive: false }), booking({ academicYear: { _id: 'old', name: 'Old' } }), booking()], selection);
  assert.equal(result.content.split('\r\n').length, 3);
  assert.ok(result.content.indexOf('Monday') < result.content.indexOf('Tuesday'));
  assert.equal(result.filename, 'timetable-2026-27-Class-6-A.csv');
});

test('CSV handles quotes, commas, newlines, Unicode and spreadsheet formulas', () => {
  const row = booking({ roomNumber: '=1+1' });
  row.teacherAssignment.subject.name = 'ગુજરાતી, "Language"\nLesson';
  const result = timetableCsv([row], selection);
  assert.ok(result.content.startsWith('\uFEFF'));
  assert.ok(result.content.includes('"ગુજરાતી, ""Language""\nLesson"'));
  assert.ok(result.content.includes('"\'=1+1"'));
});

test('export rejects incomplete selection and empty timetables', () => {
  assert.throws(() => timetableCsv([booking()], { schoolClass: 'class' }), /Select an academic year/);
  assert.throws(() => timetableCsv([], selection), /No active lessons/);
});
