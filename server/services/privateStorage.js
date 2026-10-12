import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { fail } from '../utils/errors.js';
const repo = fileURLToPath(new URL('../../', import.meta.url));
export function maxPdfBytes() {
  const n = Number(process.env.RESOURCE_MAX_MB || 10);
  if (!Number.isFinite(n) || n <= 0 || n > 100) throw new Error('RESOURCE_MAX_MB must be between 0 and 100');
  return Math.floor(n * 1024 * 1024);
}
export async function storageRoot() {
  const root = path.resolve(process.env.RESOURCE_STORAGE_DIR || path.join(repo, 'server/.private-resources'));
  const forbidden = [path.join(repo, 'client'), path.join(repo, 'public'), path.join(repo, 'server/public')];
  const beneath = (child, parent) => { const relative = path.relative(parent, child); return !relative || (!relative.startsWith('..') && !path.isAbsolute(relative)); };
  if (forbidden.some(dir => beneath(root, dir))) fail(500, 'Resource storage must be outside public directories');
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const real = await fs.realpath(root);
  if (forbidden.some(dir => beneath(real, dir))) fail(500, 'Resource storage must be private');
  return real;
}
export function validKey(key) { return typeof key === 'string' && /^[a-f0-9-]{36}\.pdf$/.test(key); }
export async function privatePath(key) {
  if (!validKey(key)) fail(400, 'Invalid file key');
  const target = path.join(await storageRoot(), key);
  try { if ((await fs.lstat(target)).isSymbolicLink()) fail(400, 'Invalid stored file'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  return target;
}
export function validatePdf(file) {
  if (!file || !/\.pdf$/i.test(file.originalname) || !['application/pdf', 'application/octet-stream'].includes(file.mimetype) || !file.buffer?.length || file.buffer.length > maxPdfBytes()) fail(400, 'Upload a PDF within the configured size limit');
  if (!/^%PDF-(1\.[0-7]|2\.0)(\s|$)/.test(file.buffer.subarray(0, 16).toString('ascii')) || !/%%EOF\s*$/.test(file.buffer.subarray(-1024).toString('ascii'))) fail(400, 'File content is not a supported PDF');
  if (/[\\/\x00-\x1f]/.test(file.originalname) || file.originalname.length > 200) fail(400, 'Invalid file name');
}
export async function storePdf(file) {
  validatePdf(file);
  const key = `${randomUUID()}.pdf`, root = await storageRoot(), target = path.join(root, key), temp = `${target}.part`;
  try { await fs.writeFile(temp, file.buffer, { flag: 'wx', mode: 0o600 }); await fs.rename(temp, target); }
  catch (e) { await fs.unlink(temp).catch(() => {}); throw e; }
  return { key, name: file.originalname, mime: 'application/pdf', size: file.buffer.length, sha256: createHash('sha256').update(file.buffer).digest('hex') };
}
export async function removeFile(key) { await fs.unlink(await privatePath(key)).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
// Future object storage adapters must implement store/read/remove with private keys;
// authorization remains in the resource service, never in a public static route.
