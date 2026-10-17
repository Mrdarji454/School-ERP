import test from 'node:test';
import assert from 'node:assert/strict';
import { schoolClock, dashboardYear, attendanceChoices, attendancePercent, timetablePreview, scopedFees } from '../src/utils/adminDashboard.js';
test('dashboard dates, weekdays and greeting use school timezone across UTC midnight', () => {
  const now = new Date('2026-10-11T20:00:00Z');
  assert.equal(schoolClock('Asia/Kolkata', now).today, '2026-10-12');
  assert.equal(schoolClock('Asia/Kolkata', now).day, 'Monday');
  assert.equal(schoolClock('America/New_York', now).today, '2026-10-11');
  assert.equal(schoolClock('Asia/Kolkata', now).greeting, 'Good morning');
  assert.equal(schoolClock('Asia/Kolkata', new Date('2026-10-12T13:00:00Z')).greeting, 'Good evening');
});
test('dashboard year retains explicit choice and attendance options exclude unrelated/inactive targets', () => {
  const options = { years: [{ _id: 'y', isActive: true, isCurrent: true }], classes: [{ _id: 'c', academicYear: 'y', eligible: true }, { _id: 'old', academicYear: 'y', eligible: false }, { _id: 'other', academicYear: 'z', eligible: true }], sections: [{ _id: 's', schoolClass: 'c', eligible: true }, { _id: 'bad', schoolClass: 'c', eligible: false }, { _id: 'unrelated', schoolClass: 'other', eligible: true }] };
  assert.equal(dashboardYear({ year: '', options }), 'y');
  assert.equal(dashboardYear({ year: 'z', options }), 'z');
  assert.deepEqual(attendanceChoices(options, 'y', 'c').classes.map(c => c._id), ['c']);
  assert.deepEqual(attendanceChoices(options, 'y', 'c').sections.map(s => s._id), ['s']);
});
test('attendance percentage uses Present only and never fabricates attendance for empty records', () => {
  assert.equal(attendancePercent({ present: 2, absent: 1, late: 1, halfDay: 1, leave: 1, total: 6 }), 33.33);
  assert.equal(attendancePercent({ present: 0, total: 0 }), null);
  assert.equal(attendancePercent(undefined), null);
});
test('timetable preview reports full eligible total and respects active year dates and periods', () => {
  const academicYear = { _id: 'y', startDate: '2026-04-01', endDate: '2027-03-31' };
  const assignments = [{ _id: 'a', eligible: true, academicYear }, { _id: 'inactive', eligible: false, academicYear }];
  const records = Array.from({ length: 8 }, (_, n) => ({ _id: String(n), isActive: true, academicYear: 'y', teacherAssignment: { _id: 'a' }, day: 'Monday', period: { isActive: true, startTime: `0${n + 1}:00` } }));
  records.push({ ...records[0], _id: 'invalid', teacherAssignment: 'inactive' }, { ...records[0], _id: 'break', period: { isActive: true, isBreak: true } });
  const result = timetablePreview(records, assignments, 'y', 'Monday', '2026-10-12');
  assert.equal(result.total, 8); assert.equal(result.records.length, 5);
  assert.deepEqual(result.records.map(r => r._id), ['0', '1', '2', '3', '4']);
  assert.equal(timetablePreview(records, assignments, 'y', 'Monday', '2027-04-01').total, 0);
});
test('fee summary refuses mismatched or missing academic-year scope and preserves real zero', () => {
  const data = { statistics: { currentAcademicYear: { _id: 'y' }, feesCollected: 0 } };
  assert.equal(scopedFees(data, 'y'), 0); assert.equal(scopedFees(data, 'z'), null);
  assert.equal(scopedFees(undefined, 'y'), null);
});
