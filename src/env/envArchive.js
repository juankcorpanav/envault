const fs = require('fs');
const path = require('path');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

const ARCHIVE_DIR = path.resolve('.envault', 'archives');

function ensureArchiveDir() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

function archiveFilePath(vaultName) {
  return path.join(ARCHIVE_DIR, `${vaultName}.archive.json`);
}

function loadArchive(vaultName) {
  const filePath = archiveFilePath(vaultName);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function saveArchive(vaultName, entries) {
  ensureArchiveDir();
  fs.writeFileSync(archiveFilePath(vaultName), JSON.stringify(entries, null, 2));
}

function archiveEnv(vaultName, envObject, meta = {}) {
  const entries = loadArchive(vaultName);
  const entry = {
    id: `arc_${Date.now()}`,
    archivedAt: new Date().toISOString(),
    meta,
    snapshot: serializeEnv(envObject),
  };
  entries.push(entry);
  saveArchive(vaultName, entries);
  return entry;
}

function listArchives(vaultName) {
  return loadArchive(vaultName).map(({ id, archivedAt, meta }) => ({
    id,
    archivedAt,
    meta,
  }));
}

function getArchiveEntry(vaultName, archiveId) {
  const entries = loadArchive(vaultName);
  const entry = entries.find((e) => e.id === archiveId);
  if (!entry) throw new Error(`Archive entry '${archiveId}' not found for vault '${vaultName}'.`);
  return { ...entry, env: parseEnv(entry.snapshot) };
}

function deleteArchiveEntry(vaultName, archiveId) {
  const entries = loadArchive(vaultName);
  const filtered = entries.filter((e) => e.id !== archiveId);
  if (filtered.length === entries.length) {
    throw new Error(`Archive entry '${archiveId}' not found.`);
  }
  saveArchive(vaultName, filtered);
  return archiveId;
}

function clearArchives(vaultName) {
  saveArchive(vaultName, []);
}

module.exports = {
  ensureArchiveDir,
  archiveFilePath,
  loadArchive,
  archiveEnv,
  listArchives,
  getArchiveEntry,
  deleteArchiveEntry,
  clearArchives,
};
