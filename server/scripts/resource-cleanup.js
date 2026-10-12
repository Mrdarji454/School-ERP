// No dotenv fallback; choose both the database and private storage explicitly.
import mongoose from 'mongoose';
import { cleanupResources } from '../services/resourceCleanup.js';
try {
  if (!process.env.RESOURCE_CLEANUP_URI || !process.env.RESOURCE_STORAGE_DIR) throw new Error('Explicit cleanup configuration required');
  await mongoose.connect(process.env.RESOURCE_CLEANUP_URI, { autoIndex: false, autoCreate: false });
  const result = await cleanupResources({ remove: process.argv.includes('--delete-unreferenced') });
  console.log(`Unreferenced files older than 24h: ${result.candidates.length}; removed: ${result.removed.length}. Referenced resource files retained.`);
} catch { console.error('Cleanup failed; check the explicitly selected database and private directory. No connection details logged.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
