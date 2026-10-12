import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { demoConfig, connectDemo, manifestCollection, MANIFEST_ID } from './config.js';
try {
  const config = demoConfig();
  process.env.NODE_ENV = 'development';
  process.env.RESOURCE_STORAGE_DIR ||= fileURLToPath(new URL('../../.demo-resource-files/', import.meta.url));
  process.env.SCHOOL_TIMEZONE = config.timeZone;
  process.env.CLIENT_ORIGIN = process.env.DEMO_CLIENT_ORIGIN || 'http://127.0.0.1:5174';
  process.env.JWT_SECRET = process.env.DEMO_JWT_SECRET || 'development-demo-only-secret-do-not-use-in-production';
  await connectDemo(config);
  const manifest = await manifestCollection().findOne({ _id: MANIFEST_ID });
  if (manifest?.state !== 'complete') throw Object.assign(new Error('Run npm run seed:demo before starting the demo API.'), { demoSafe: true });
  process.env.SCHOOL_TIMEZONE = manifest.timeZone;
  const { default: app } = await import('../../app.js');
  const port = Number(process.env.DEMO_API_PORT || 5001);
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 5000) throw Object.assign(new Error('Choose a dedicated DEMO_API_PORT (default 5001), not the normal API port 5000.'), { demoSafe: true });
  app.listen(port, '127.0.0.1', () => console.log(`Demo API ready on loopback port ${port}; database school_erp_demo. School date follows ${manifest.timeZone}.`));
} catch (error) { console.error(error.demoSafe ? error.message : 'Demo API startup failed; check dedicated demo configuration and replica-set readiness. Connection details are not logged.'); await mongoose.disconnect(); process.exitCode = 1; }
