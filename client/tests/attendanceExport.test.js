import test from 'node:test';
import assert from 'node:assert/strict';
import { collectAttendanceExport, attendanceCsv } from '../src/utils/attendanceExport.js';

const filters = { academicYear: 'year', schoolClass: 'class', section: 'a', from: '2026-10-01', to: '2026-10-10', locked: 'true', studentStatus: 'Absent', status: 'active', page: 5, limit: 20 };
const record = id => ({ _id: id, attendanceDate: '2026-10-01T00:00:00Z', teacherAssignment: { academicYear: { _id: 'year', name: '2026-27' }, schoolClass: { _id: 'class', name: 'Class 6' }, section: { _id: 'a', name: 'A' }, subject: { name: 'English' }, teacher: { user: { fullname: 'Teacher' } } }, period: { name: 'P1', startTime: '09:00', endTime: '09:45' }, counts: { total: 25, present: 20, absent: 2, late: 1, halfDay: 1, leave: 1, attendancePercentage: 80 }, isActive: true, isLocked: true });

test('attendance export gathers all pages, preserves filters and starts at page one', async () => {
  const calls = [];
  const result = await collectAttendanceExport(async (path, query) => {
    calls.push({ path, ...query });
    return { records: [record(String(query.page))], pagination: { total: 2, totalPages: 2, page: query.page } };
  }, filters);
  assert.equal(result.length, 2);
  assert.deepEqual(calls.map(c => c.page), [1, 2]);
  for (const call of calls) { assert.equal(call.limit, 100); assert.equal(call.locked, 'true'); assert.equal(call.from, filters.from); assert.equal(call.studentStatus, 'Absent'); }
  assert.equal(filters.page, 5);
});
test('attendance export rejects invalid scope, dates, empty data and changing pagination', async () => {
  const response = records => async () => ({ records, pagination: { total: records.length, totalPages: 1, page: 1 } });
  await assert.rejects(collectAttendanceExport(response([]), { ...filters, section: '' }), /Select academic/);
  await assert.rejects(collectAttendanceExport(response([]), { ...filters, from: '2026-11-01' }), /End date/);
  await assert.rejects(collectAttendanceExport(response([]), filters), /No attendance/);
  const wrong = record('wrong'); wrong.teacherAssignment.section._id = 'b';
  await assert.rejects(collectAttendanceExport(response([wrong]), filters), /does not match/);
  await assert.rejects(collectAttendanceExport(async (_, q) => ({ records: [record('duplicate')], pagination: { total: 2, totalPages: 2, page: q.page } }), filters), /changed during export/);
});
test('attendance CSV includes all status counts and safely quotes labels', () => {
  const row = record('1'); row.teacherAssignment.subject.name = '=SUM(1,2)'; row.teacherAssignment.teacher.user.fullname = 'Teacher "A", Name';
  const csv = attendanceCsv([row]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('"Teacher ""A"", Name"'));
  assert.ok(csv.includes('"25","20","2","1","1","1","80","Active","Locked"'));
});
