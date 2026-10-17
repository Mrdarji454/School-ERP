import test from 'node:test';
import assert from 'node:assert/strict';
import { assignmentTimestamp } from '../src/utils/assignmentTime.js';
test('instruction-only edits preserve published instants across timezone conversion and minute controls', () => {
  const original = '2026-10-16T20:10:47.123Z';
  assert.equal(assignmentTimestamp('2026-10-17T01:40', original, 'Asia/Kolkata'), original);
  assert.equal(assignmentTimestamp('2026-10-17T01:41', original, 'Asia/Kolkata'), '2026-10-16T20:11:00.000Z');
});
test('optional cutoff may be cleared and nonexistent local deadline is rejected', () => {
  assert.equal(assignmentTimestamp('', '2026-10-17T10:00:00Z', 'Asia/Kolkata'), null);
  assert.throws(() => assignmentTimestamp('2026-03-08T02:30', null, 'America/New_York'), /does not exist/);
});
