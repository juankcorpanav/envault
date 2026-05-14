/**
 * envExpiry.js — Key-level expiry/TTL support for env entries
 */

const fs = require('fs');
const path = require('path');

const EXPIRY_DIR = path.join(process.cwd(), '.envault', 'expiry');

function ensureExpiryDir() {
  if (!fs.existsSync(EXPIRY_DIR)) {
    fs.mkdirSync(EXPIRY_DIR, { recursive: true });
  }
}

function expiryFilePath(vaultName) {
  return path.join(EXPIRY_DIR, `${vaultName}.expiry.json`);
}

function loadExpiry(vaultName) {
  const filePath = expiryFilePath(vaultName);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveExpiry(vaultName, expiryMap) {
  ensureExpiryDir();
  fs.writeFileSync(expiryFilePath(vaultName), JSON.stringify(expiryMap, null, 2));
}

function setExpiry(vaultName, key, ttlSeconds) {
  if (typeof ttlSeconds !== 'number' || ttlSeconds <= 0) {
    throw new Error('ttlSeconds must be a positive number');
  }
  const expiryMap = loadExpiry(vaultName);
  expiryMap[key] = Date.now() + ttlSeconds * 1000;
  saveExpiry(vaultName, expiryMap);
  return expiryMap[key];
}

function removeExpiry(vaultName, key) {
  const expiryMap = loadExpiry(vaultName);
  if (!(key in expiryMap)) return false;
  delete expiryMap[key];
  saveExpiry(vaultName, expiryMap);
  return true;
}

function isExpired(vaultName, key) {
  const expiryMap = loadExpiry(vaultName);
  if (!(key in expiryMap)) return false;
  return Date.now() > expiryMap[key];
}

function listExpiredKeys(vaultName) {
  const expiryMap = loadExpiry(vaultName);
  const now = Date.now();
  return Object.entries(expiryMap)
    .filter(([, ts]) => now > ts)
    .map(([key]) => key);
}

function listExpiryEntries(vaultName) {
  const expiryMap = loadExpiry(vaultName);
  return Object.entries(expiryMap).map(([key, ts]) => ({
    key,
    expiresAt: new Date(ts).toISOString(),
    expired: Date.now() > ts,
  }));
}

module.exports = {
  ensureExpiryDir,
  expiryFilePath,
  loadExpiry,
  saveExpiry,
  setExpiry,
  removeExpiry,
  isExpired,
  listExpiredKeys,
  listExpiryEntries,
};
