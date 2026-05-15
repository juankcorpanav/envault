const fs = require('fs');
const path = require('path');

const EXPIRY_DIR = path.resolve('.envault', 'expiry');

function ensureExpiryDir() {
  if (!fs.existsSync(EXPIRY_DIR)) {
    fs.mkdirSync(EXPIRY_DIR, { recursive: true });
  }
}

function expiryFilePath(vaultName) {
  return path.join(EXPIRY_DIR, `${vaultName}.json`);
}

function loadExpiry(vaultName) {
  const file = expiryFilePath(vaultName);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveExpiry(vaultName, data) {
  ensureExpiryDir();
  fs.writeFileSync(expiryFilePath(vaultName), JSON.stringify(data, null, 2));
}

function setExpiry(vaultName, key, expiresAt) {
  if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
    throw new Error(`Invalid expiry date for key "${key}"`);
  }
  const data = loadExpiry(vaultName);
  data[key] = expiresAt.toISOString();
  saveExpiry(vaultName, data);
}

function removeExpiry(vaultName, key) {
  const data = loadExpiry(vaultName);
  if (!Object.prototype.hasOwnProperty.call(data, key)) return false;
  delete data[key];
  saveExpiry(vaultName, data);
  return true;
}

function isExpired(vaultName, key) {
  const data = loadExpiry(vaultName);
  if (!data[key]) return false;
  return new Date(data[key]) <= new Date();
}

function listExpired(vaultName) {
  const data = loadExpiry(vaultName);
  const now = new Date();
  return Object.entries(data)
    .filter(([, iso]) => new Date(iso) <= now)
    .map(([key, iso]) => ({ key, expiresAt: iso }));
}

function listExpiry(vaultName) {
  const data = loadExpiry(vaultName);
  return Object.entries(data).map(([key, iso]) => ({
    key,
    expiresAt: iso,
    expired: new Date(iso) <= new Date()
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
  listExpired,
  listExpiry
};
