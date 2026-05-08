const fs = require('fs');
const path = require('path');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

const SNAPSHOT_DIR = path.resolve('.envault', 'snapshots');

function ensureSnapshotDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function createSnapshot(vaultName, envObject) {
  ensureSnapshotDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotId = `${vaultName}__${timestamp}`;
  const snapshotPath = path.join(SNAPSHOT_DIR, `${snapshotId}.snap`);
  const content = JSON.stringify({ vaultName, timestamp, env: envObject }, null, 2);
  fs.writeFileSync(snapshotPath, content, 'utf-8');
  return snapshotId;
}

function listSnapshots(vaultName) {
  ensureSnapshotDir();
  const files = fs.readdirSync(SNAPSHOT_DIR);
  return files
    .filter(f => f.startsWith(vaultName + '__') && f.endsWith('.snap'))
    .map(f => f.replace('.snap', ''))
    .sort();
}

function loadSnapshot(snapshotId) {
  const snapshotPath = path.join(SNAPSHOT_DIR, `${snapshotId}.snap`);
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }
  const raw = fs.readFileSync(snapshotPath, 'utf-8');
  return JSON.parse(raw);
}

function deleteSnapshot(snapshotId) {
  const snapshotPath = path.join(SNAPSHOT_DIR, `${snapshotId}.snap`);
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }
  fs.unlinkSync(snapshotPath);
  return true;
}

module.exports = { createSnapshot, listSnapshots, loadSnapshot, deleteSnapshot };
