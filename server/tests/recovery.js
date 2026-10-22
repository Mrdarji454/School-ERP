// Synthetic recovery rehearsal only. This is not a production backup utility.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { storageRoot, validKey } from '../services/privateStorage.js';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const { EJSON } = mongoose.mongo.BSON;
const encode = value => EJSON.stringify(value, { relaxed: false });
const decode = value => EJSON.parse(value, { relaxed: false });

export async function verifyRecovery({ directory, port, request, token }) {
  const source = mongoose.connection.db;
  assert.equal(source.databaseName, 'erp_isolated_test');
  assert.equal(mongoose.connection.host, '127.0.0.1');
  const started = Date.now();
  const backup = await fs.mkdtemp(path.join(directory, 'recovery-backup-'));
  const restoredFiles = await fs.mkdtemp(path.join(directory, 'recovery-files-'));
  const originalStorage = process.env.RESOURCE_STORAGE_DIR;
  const privateRoot = await storageRoot();
  const collections = await source.listCollections().toArray();
  const manifest = { format: 'synthetic-ejson-rehearsal-v1', collections: [], files: [] };
  // All fixture writers have completed before this function is called.
  for (const [number, collection] of collections.entries()) {
    assert.equal(collection.type, 'collection');
    const docs = await source.collection(collection.name).find().sort({ _id: 1 }).toArray();
    const bytes = Buffer.from(encode(docs));
    const file = `${number}.ejson`;
    await fs.writeFile(path.join(backup, file), bytes, { flag: 'wx' });
    manifest.collections.push({ name: collection.name, options: collection.options, file,
      count: docs.length, sha256: digest(bytes), indexes: await source.collection(collection.name).indexes() });
  }
  for (const entry of await fs.readdir(privateRoot, { withFileTypes: true })) {
    assert.ok(entry.isFile() && validKey(entry.name), 'Unexpected private artifact in recovery source');
    const bytes = await fs.readFile(path.join(privateRoot, entry.name));
    await fs.writeFile(path.join(backup, entry.name), bytes, { flag: 'wx' });
    manifest.files.push({ key: entry.name, sha256: digest(bytes), size: bytes.length });
  }
  await fs.writeFile(path.join(backup, 'manifest.ejson'), encode(manifest), { flag: 'wx' });
  const saved = decode(await fs.readFile(path.join(backup, 'manifest.ejson'), 'utf8'));
  const targetName = `erp_restore_check_${Date.now()}`;
  const client = new mongoose.mongo.MongoClient(`mongodb://127.0.0.1:${port}/?replicaSet=erpTest`);
  await client.connect();
  const target = client.db(targetName);
  try {
    assert.equal((await target.listCollections().toArray()).length, 0, 'Never overwrite a restore target');
    for (const item of saved.collections) {
      const bytes = await fs.readFile(path.join(backup, item.file));
      assert.equal(digest(bytes), item.sha256);
      await target.createCollection(item.name, item.options);
      const docs = decode(bytes.toString());
      if (docs.length) await target.collection(item.name).insertMany(docs);
      for (const index of item.indexes.filter(i => i.name !== '_id_')) {
        const { key, v, ns, ...options } = index;
        void v; void ns;
        await target.collection(item.name).createIndex(key, options);
      }
      const restored = await target.collection(item.name).find().sort({ _id: 1 }).toArray();
      assert.equal(digest(Buffer.from(encode(restored))), item.sha256, `Restored records: ${item.name}`);
      assert.equal(encode(await target.collection(item.name).indexes()), encode(item.indexes), `Restored indexes: ${item.name}`);
    }
    for (const item of saved.files) {
      const bytes = await fs.readFile(path.join(backup, item.key));
      assert.equal(digest(bytes), item.sha256);
      await fs.writeFile(path.join(restoredFiles, item.key), bytes, { flag: 'wx' });
      assert.equal(digest(await fs.readFile(path.join(restoredFiles, item.key))), item.sha256);
    }
    // Point the already-running test API at the separate restored DB and files.
    await mongoose.disconnect();
    await mongoose.connect(`mongodb://127.0.0.1:${port}/${targetName}?replicaSet=erpTest`);
    process.env.RESOURCE_STORAGE_DIR = restoredFiles;
    await request('GET', '/auth/me', null, token);
    const cards = await target.collection('reportcards').find().toArray();
    assert.ok(cards.length >= 4, 'Rehearsal must include original and corrected cards');
    const readiness = fileURLToPath(new URL('../scripts/readiness.js', import.meta.url));
    const environment = { ...process.env, MONGO_URI: `mongodb://127.0.0.1:${port}/${targetName}?replicaSet=erpTest` };
    const output = execFileSync(process.execPath, [readiness, '--local', '--database'], { env: environment, windowsHide: true, timeout: 30000, encoding: 'utf8' });
    assert.match(output, /PASS Database is a writable replica primary/);
    assert.throws(() => execFileSync(process.execPath, [readiness, '--local', '--database'], {
      env: { ...environment, MONGO_URI: `mongodb://127.0.0.1:${port}/erp_restore_missing_indexes?replicaSet=erpTest` },
      windowsHide: true, timeout: 30000, stdio: 'pipe',
    }), 'Missing uniqueness indexes must fail readiness');
    for (const card of cards) {
      const owner = await target.collection('users').findOne({ _id: card.user });
      assert.ok(owner?.isActive && !owner.mustChangePassword);
      const ownerToken = jwt.sign({ id: String(owner._id), tokenVersion: owner.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: '5m' });
      const bytes = await request('GET', `/report-cards/${card._id}/pdf`, null, ownerToken);
      assert.equal(digest(bytes), card.file.sha256);
      assert.equal(bytes.length, card.file.size);
      assert.deepEqual(await request('GET', `/report-cards/${card._id}/pdf`, null, token), bytes);
      await request('GET', `/report-cards/${card._id}/pdf`, null, null, 401);
      const otherCard = cards.find(other => String(other.user) !== String(card.user));
      assert.ok(otherCard);
      await request('GET', `/report-cards/${otherCard._id}/pdf`, null, ownerToken, 404);
    }
    const first = cards[0], firstPath = path.join(restoredFiles, first.file.key);
    const original = await fs.readFile(firstPath);
    await fs.writeFile(firstPath, 'synthetic restore corruption');
    await request('GET', `/report-cards/${first._id}/pdf`, null, token, 503);
    await fs.writeFile(firstPath, original);
    assert.equal(digest(await request('GET', `/report-cards/${first._id}/pdf`, null, token)), first.file.sha256);
    const report = { collections: saved.collections.length, records: saved.collections.reduce((n, c) => n + Number(c.count), 0),
      files: saved.files.length, reportCards: cards.length, elapsedSeconds: (Date.now() - started) / 1000,
      scope: 'Quiesced synthetic EJSON recovery; not mongodump, disaster recovery, or production RTO evidence' };
    await fs.writeFile(path.join(backup, 'result.json'), JSON.stringify(report, null, 2));
    console.log(`PASS: isolated recovery ${JSON.stringify(report)}`);
  } finally {
    await mongoose.disconnect();
    process.env.RESOURCE_STORAGE_DIR = originalStorage;
    await client.close();
  }
}
