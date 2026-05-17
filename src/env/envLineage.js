/**
 * envLineage.js
 * Tracks the origin and transformation history of individual env keys.
 */

const fs = require('fs');
const path = require('path');

const LINEAGE_DIR = path.join(process.cwd(), '.envault', 'lineage');

function ensureLineageDir() {
  if (!fs.existsSync(LINEAGE_DIR)) {
    fs.mkdirSync(LINEAGE_DIR, { recursive: true });
  }
}

function lineageFilePath(vaultName) {
  return path.join(LINEAGE_DIR, `${vaultName}.lineage.json`);
}

function loadLineage(vaultName) {
  ensureLineageDir();
  const filePath = lineageFilePath(vaultName);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveLineage(vaultName, lineage) {
  ensureLineageDir();
  fs.writeFileSync(lineageFilePath(vaultName), JSON.stringify(lineage, null, 2));
}

function recordLineage(vaultName, key, entry) {
  const lineage = loadLineage(vaultName);
  if (!lineage[key]) lineage[key] = [];
  lineage[key].push({
    timestamp: new Date().toISOString(),
    ...entry,
  });
  saveLineage(vaultName, lineage);
  return lineage[key];
}

function getKeyLineage(vaultName, key) {
  const lineage = loadLineage(vaultName);
  return lineage[key] || [];
}

function clearKeyLineage(vaultName, key) {
  const lineage = loadLineage(vaultName);
  delete lineage[key];
  saveLineage(vaultName, lineage);
}

function listTrackedKeys(vaultName) {
  const lineage = loadLineage(vaultName);
  return Object.keys(lineage);
}

function formatLineageReport(vaultName, key) {
  const entries = getKeyLineage(vaultName, key);
  if (!entries.length) return `No lineage recorded for key: ${key}`;
  const lines = entries.map(
    (e, i) => `  [${i + 1}] ${e.timestamp} — ${e.action}${e.source ? ` (source: ${e.source})` : ''}${e.by ? ` by ${e.by}` : ''}`
  );
  return [`Lineage for "${key}" in vault "${vaultName}":`, ...lines].join('\n');
}

module.exports = {
  ensureLineageDir,
  lineageFilePath,
  loadLineage,
  saveLineage,
  recordLineage,
  getKeyLineage,
  clearKeyLineage,
  listTrackedKeys,
  formatLineageReport,
};
