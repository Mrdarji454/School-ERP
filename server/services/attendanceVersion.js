import { fail } from '../utils/errors.js';
export function expectedVersion(body, row) {
  if (body.version === undefined) fail(428, 'Reload attendance before saving: version is required');
  if (!Number.isSafeInteger(body.version) || body.version < 0) fail(400, 'Invalid attendance version');
  if (body.version !== row.__v) fail(409, 'Attendance changed since you opened it. Reload and review before saving; your changes were not applied.');
  return body.version;
}
export function auditAction(user, action, reason) {
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 500) fail(400, 'A reason of 1–500 characters is required');
  return { actor: user._id, action, reason: reason.trim(), at: new Date() };
}
