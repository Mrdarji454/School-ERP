import test from 'node:test';
import assert from 'node:assert/strict';
import { publicationLabel, schoolTimestamp, schoolDateTimeInput } from '../src/utils/publication.js';
import { resourceChoices } from '../src/utils/resourceChoices.js';
test('publication labels keep draft and archived states separate from timed publication', () => {
  const now = new Date('2026-10-10T00:00:00Z');
  assert.equal(publicationLabel({ state: 'draft', publishAt: '2020-01-01' }, now), 'Draft');
  assert.equal(publicationLabel({ state: 'published', publishAt: '2026-10-11T00:00:00Z' }, now), 'Scheduled');
  assert.equal(publicationLabel({ state: 'published', expiresAt: now.toISOString() }, now), 'Expired');
  assert.equal(publicationLabel({ state: 'archived' }, now), 'Archived');
  assert.equal(publicationLabel({ isActive: false }, now), 'Inactive');
});
test('school timestamp conversion is independent of device timezone', () => {
  assert.equal(schoolTimestamp('2026-10-10T09:30', 'Asia/Kolkata'), '2026-10-10T04:00:00.000Z');
  assert.equal(schoolDateTimeInput('2026-10-10T04:00:00Z', 'Asia/Kolkata'), '2026-10-10T09:30');
  assert.equal(schoolTimestamp('', 'Asia/Kolkata'), null);
  assert.throws(() => schoolTimestamp('2026-02-30T12:00', 'Asia/Kolkata'));
});
test('Teacher resource choices exclude inactive assignments and preserve class relationships', () => {
  const a = { eligible: true, academicYear: { _id: 'y' }, schoolClass: { _id: 'c' }, section: { _id: 's' }, subject: { _id: 'sub' } };
  const result = resourceChoices({ assignments: [a, { ...a, eligible: false, subject: { _id: 'hidden' } }] }, false);
  assert.deepEqual(result.subjects.map(s => s._id), ['sub']); assert.equal(result.subjects[0].schoolClass, 'c');
});
