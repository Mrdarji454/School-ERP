import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentStorageKey, paymentActorId, readPaymentDraft, paymentMayBeEditedAfterFailure } from '../src/utils/paymentDraft.js';
test('uncertain payment retries retain the key and exact details across reopening, isolated per actor and balance', () => {
  const key = paymentStorageKey('admin-one', 'fee', 'obligation-one');
  assert.equal(paymentActorId({ id: 'admin-one' }), paymentActorId({ _id: 'admin-one' }), 'Login and restored sessions must address the same pending attempt');
  const pending = { key: 'logical-payment-1', body: { studentFee: 'obligation-one', amount: 12.34, paymentMethod: 'Cash', remarks: 'Original note' } };
  const storage = { getItem: k => k === key ? JSON.stringify(pending) : null };
  assert.deepEqual(readPaymentDraft(storage, key), pending);
  assert.equal(readPaymentDraft(storage, paymentStorageKey('admin-two', 'fee', 'obligation-one')), null);
  assert.equal(readPaymentDraft(storage, paymentStorageKey('admin-one', 'salary', 'obligation-one')), null);
  assert.throws(() => readPaymentDraft({ getItem: () => '{broken' }, key));
});
test('only confirmed validation or overpayment rejection unlocks details; uncertain outcomes retain the original attempt', () => {
  for (const error of [{}, { response: { status: 500 } }, { response: { status: 401 } }, { response: { status: 409, data: { message: 'Idempotency key was already used for a different payment' } } }]) assert.equal(Boolean(paymentMayBeEditedAfterFailure(error)), false);
  assert.equal(paymentMayBeEditedAfterFailure({ response: { status: 400 } }), true);
  assert.equal(paymentMayBeEditedAfterFailure({ response: { status: 409, data: { message: 'Payment would exceed the balance or reverse unrecorded funds' } } }), true);
});
