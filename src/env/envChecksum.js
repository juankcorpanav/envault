/**
 * envChecksum.js
 * Compute and verify checksums for .env vault contents.
 * Used to detect tampering or unexpected mutations.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CHECKSUM_DIR = path.resolve('.envault', 'checksums');

function ensureChecksumDir() {
  if (!fs.existsSync(CHECKSUM_DIR)) {
    fs.mkdirSync(CHECKSUM_DIR, { recursive: true });
  }
}

function checksumFilePath(vaultName) {
  return path.join(CHECKSUM_DIR, `${vaultName}.checksum.json`);
}

function computeChecksum(envObject) {
  const normalized = JSON.stringify(
    Object.keys(envObject)
      .sort()
      .reduce((acc, k) => { acc[k] = envObject[k]; return acc; }, {})
  );
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function saveChecksum(vaultName, envObject) {
  ensureChecksumDir();
  const checksum = computeChecksum(envObject);
  const record = {
    vaultName,
    checksum,
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(checksumFilePath(vaultName), JSON.stringify(record, null, 2));
  return checksum;
}

function loadChecksum(vaultName) {
  const filePath = checksumFilePath(vaultName);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function verifyChecksum(vaultName, envObject) {
  const record = loadChecksum(vaultName);
  if (!record) {
    return { valid: false, reason: 'No checksum record found', stored: null, computed: null };
  }
  const computed = computeChecksum(envObject);
  const valid = computed === record.checksum;
  return {
    valid,
    reason: valid ? 'Checksum matches' : 'Checksum mismatch — possible tampering detected',
    stored: record.checksum,
    computed,
    savedAt: record.savedAt,
  };
}

function deleteChecksum(vaultName) {
  const filePath = checksumFilePath(vaultName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

module.exports = {
  ensureChecksumDir,
  checksumFilePath,
  computeChecksum,
  saveChecksum,
  loadChecksum,
  verifyChecksum,
  deleteChecksum,
};
