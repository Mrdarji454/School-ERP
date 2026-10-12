import validator from 'validator';
import { fail } from '../utils/errors.js';
export function password(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128 || Buffer.byteLength(value, 'utf8') > 72) fail(400, 'Password must be 8–72 UTF-8 bytes (at most 128 characters).');
}
export function onlyFields(data, allowed) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(k => !allowed.includes(k))) fail(400, 'Unsupported profile field');
}
export function profileValues(data) {
  for (const [key, value] of Object.entries(data)) {
    if (['accountActive', 'isActive'].includes(key)) { if (typeof value !== 'boolean') fail(400, `Invalid ${key}`); }
    else if (['rollNumber', 'experience'].includes(key)) { if (!Number.isFinite(Number(value)) || Number(value) < (key === 'rollNumber' ? 1 : 0) || (key === 'rollNumber' && !Number.isSafeInteger(Number(value)))) fail(400, `Invalid ${key}`); }
    else if (typeof value !== 'string' || value.length > (key === 'address' ? 1000 : 200)) fail(400, `Invalid ${key}`);
  }
  if (data.email !== undefined && !validator.isEmail(data.email)) fail(400, 'Valid email is required');
  if (data.bloodGroup && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(data.bloodGroup)) fail(400, 'Invalid blood group');
  if (data.fullname !== undefined && !data.fullname.trim()) fail(400, 'Full name is required');
  for (const key of ['dob', 'admissionDate', 'joiningDate']) if (data[key]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data[key]) || Number.isNaN(Date.parse(data[key])) || new Date(data[key]).toISOString().slice(0, 10) !== data[key] || (key === 'dob' && new Date(data[key]) > new Date())) fail(400, `Invalid ${key}`);
  }
  for (const key of ['phone', 'guardianPhone', 'additionalGuardianPhone', 'emergencyContact']) if (data[key] && !/^\+?[\d ()-]{7,20}$/.test(data[key])) fail(400, `Invalid ${key}`);
}
