// Dedicated development instance. Never reads .env or reuses the normal service/data path.
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import mongoose from 'mongoose';
if (String(process.env.NODE_ENV).toLowerCase() === 'production') throw new Error('Demo database refuses production mode');
const port = Number(process.env.DEMO_MONGO_PORT || 27018);
if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 27017) throw new Error('Choose a dedicated DEMO_MONGO_PORT (default 27018), not 27017');
const probe = net.createServer();
await new Promise((resolve, reject) => { probe.once('error', () => reject(new Error('Demo port is occupied; no existing MongoDB instance will be modified'))); probe.listen(port, '127.0.0.1', resolve); });
await new Promise(resolve => probe.close(resolve));
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.demo-data', `port-${port}`);
await fs.mkdir(directory, { recursive: true });
const executable = process.env.DEMO_MONGOD || (process.platform === 'win32' ? 'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe' : 'mongod');
const child = spawn(executable, ['--dbpath', directory, '--port', String(port), '--bind_ip', '127.0.0.1', '--replSet', 'demoRs', '--logpath', path.join(directory, 'mongod.log'), '--logappend'], { windowsHide: true, stdio: 'ignore' });
let childError; child.on('error', error => { childError = error; });
let client;
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (childError || child.exitCode !== null) throw new Error('Could not start dedicated mongod. Check DEMO_MONGOD and the local demo log.');
    try { client = new mongoose.mongo.MongoClient(`mongodb://127.0.0.1:${port}/school_erp_demo?directConnection=true`, { serverSelectionTimeoutMS: 500 }); await client.connect(); break; }
    catch { await client?.close(); client = null; await delay(250); }
  }
  if (!client) throw new Error('Dedicated demo MongoDB startup timed out');
  const admin = client.db('admin');
  const hello = await admin.command({ hello: 1 });
  if (!hello.setName) await admin.command({ replSetInitiate: { _id: 'demoRs', members: [{ _id: 0, host: `127.0.0.1:${port}` }] } });
  for (let attempt = 0; attempt < 60; attempt++) { if ((await admin.command({ hello: 1 })).isWritablePrimary) break; if (attempt === 59) throw new Error('Demo primary election timed out'); await delay(500); }
  console.log(`Dedicated demo replica set ready on loopback port ${port}. Keep this terminal open; Ctrl+C stops it. Data persists under server/.demo-data.`);
  const stop = () => child.kill(); process.once('SIGINT', stop); process.once('SIGTERM', stop);
  await new Promise(resolve => child.once('exit', resolve));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await client?.close(); if (child.exitCode === null) child.kill(); }
