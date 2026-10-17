export const paymentStorageKey = (actor, kind, balance) => `erp-payment-${actor}-${kind}-${balance}`;
export const paymentActorId = user => user._id || user.id;
export function readPaymentDraft(storage, key) {
  const raw = storage.getItem(key);
  if (!raw) return null;
  const draft = JSON.parse(raw);
  if (!draft || typeof draft.key !== 'string' || !draft.body || typeof draft.body !== 'object') throw new Error('Stored payment attempt is unreadable. Review payment history before another collection.');
  return draft;
}
export function paymentMayBeEditedAfterFailure(error) {
  return [400, 404].includes(error.response?.status) || (error.response?.status === 409 && /exceed the balance|Reference is already recorded for another payment/.test(error.response?.data?.message || ''));
}
