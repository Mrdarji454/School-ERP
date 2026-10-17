import test from 'node:test';
import assert from 'node:assert/strict';
import { uncertainSubmission } from '../src/utils/assignmentSubmission.js';
test('empty text and invalid PDF errors leave submission input editable before an attempt is sent', () => {
  assert.equal(uncertainSubmission(new Error('Enter your work or select a PDF'), false), false);
  assert.equal(uncertainSubmission(new Error('Invalid PDF'), false), false);
});
test('lost responses retain the exact attempt, while confirmed validation/conflict errors unlock input', () => {
  for (const error of [new Error('Network failure'), { response: { status: 503 } }, { response: { status: 408 } }]) assert.equal(uncertainSubmission(error, true), true);
  for (const status of [400, 403, 404, 409, 428]) assert.equal(uncertainSubmission({ response: { status } }, true), false);
});
