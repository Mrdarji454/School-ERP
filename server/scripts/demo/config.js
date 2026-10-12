import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { schoolDate, schoolToday } from '../../utils/schoolDate.js';
export const DB_NAME = 'school_erp_demo';
export const MANIFEST_ID = 'demo-vidya-v1';
export const DEFAULT_PASSWORD = 'DemoSchool123!';
export const demoId = key => new mongoose.Types.ObjectId(createHash('sha256').update(`${MANIFEST_ID}/${key}`).digest('hex').slice(0, 24));
export function safeError(message) { return Object.assign(new Error(message), { demoSafe: true }); }
export function demoConfig(env = process.env) {
  if (String(env.NODE_ENV).toLowerCase() === 'production') throw safeError('Demo commands refuse NODE_ENV=production.');
  if (!env.DEMO_MONGODB_URI) throw safeError('Set DEMO_MONGODB_URI explicitly. Normal MONGO_URI and .env are never used.');
  let uri;
  try { uri = new URL(env.DEMO_MONGODB_URI); } catch { throw safeError('Invalid DEMO_MONGODB_URI (value not logged).'); }
  if (!['mongodb:', 'mongodb+srv:'].includes(uri.protocol) || decodeURIComponent(uri.pathname) !== `/${DB_NAME}`) throw safeError(`Demo database must be exactly ${DB_NAME}; no connection was attempted.`);
  if (uri.searchParams.has('dbName')) throw safeError('Do not use a dbName override in the demo URI.');
  const password = env.DEMO_PASSWORD || DEFAULT_PASSWORD;
  if (password.length < 8 || password.length > 128) throw safeError('DEMO_PASSWORD must contain 8–128 characters.');
  const timeZone = env.SCHOOL_TIMEZONE || 'Asia/Kolkata';
  try { new Intl.DateTimeFormat('en', { timeZone }).format(); } catch { throw safeError('Invalid SCHOOL_TIMEZONE.'); }
  return { uri: env.DEMO_MONGODB_URI, password, defaultPassword: password === DEFAULT_PASSWORD, timeZone, randomSeed: env.DEMO_RANDOM_SEED || 'vidya-2026-v1', explicitDate: env.DEMO_SEED_DATE || null };
}
export function seedDate(config) {
  process.env.SCHOOL_TIMEZONE = config.timeZone;
  let date;
  try { date = config.explicitDate ? schoolDate(config.explicitDate) : schoolToday(); } catch { throw safeError('DEMO_SEED_DATE must be a real YYYY-MM-DD school date.'); }
  const value = date.toISOString().slice(0, 10);
  if (value < '2026-04-01' || value > '2027-03-31') throw safeError('Seed date is outside 2026-04-01 through 2027-03-31. Set DEMO_SEED_DATE to a date in that year for a reproducible historical demo.');
  return value;
}
export function relativeDate(date, days) { const value = schoolDate(date); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
export function completedDays(date) {
  const result = [];
  for (let d = relativeDate(date, -1); d >= '2026-04-01' && result.length < 15; d = relativeDate(d, -1)) if (schoolDate(d).getUTCDay() !== 0) result.unshift(d);
  return result;
}
export const randomValue = (seed, key) => createHash('sha256').update(`${seed}/${key}`).digest().readUInt32BE() / 0x100000000;
export async function connectDemo(config) {
  await mongoose.connect(config.uri, { dbName: DB_NAME, autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000 });
  if (mongoose.connection.name !== DB_NAME) throw safeError('Unexpected connected database; refusing all operations.');
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName || !hello.isWritablePrimary) throw safeError('Demo requires a writable MongoDB replica-set primary. Start npm run demo:db first.');
}
export function manifestCollection() {
  if (mongoose.connection.name !== DB_NAME) throw safeError('Demo connection guard failed.');
  return mongoose.connection.db.collection('demo_seed_manifest');
}
