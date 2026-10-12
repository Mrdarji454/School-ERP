import fs from 'node:fs/promises';
import path from 'node:path';
import LearningResource from '../models/LearningResource.js';
import { storageRoot, validKey } from './privateStorage.js';
export async function cleanupResources({ remove = false, now = Date.now() } = {}) {
  const root = await storageRoot(), candidates = [], removed = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const key = entry.name.endsWith('.part') ? entry.name.slice(0, -5) : entry.name;
    if (!validKey(key)) continue;
    const file = path.join(root, entry.name), stat = await fs.lstat(file);
    if (stat.isSymbolicLink() || now - stat.mtimeMs < 24 * 60 * 60 * 1000) continue;
    if (await LearningResource.exists({ 'file.key': key })) continue;
    candidates.push(entry.name);
    // Recheck immediately before removal. Referenced archived resources are retained.
    if (remove && !await LearningResource.exists({ 'file.key': key })) { await fs.unlink(file); removed.push(entry.name); }
  }
  return { candidates, removed };
}
