const fs = require('fs');
const path = require('path');

const LOCK_DIR = path.resolve('.envault', 'locks');

function ensureLockDir() {
  if (!fs.existsSync(LOCK_DIR)) {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
  }
}

function lockPath(vaultName) {
  return path.join(LOCK_DIR, `${vaultName}.lock`);
}

function lockVault(vaultName, lockedBy = 'unknown', reason = '') {
  ensureLockDir();
  const lp = lockPath(vaultName);
  if (fs.existsSync(lp)) {
    const existing = JSON.parse(fs.readFileSync(lp, 'utf8'));
    throw new Error(`Vault "${vaultName}" is already locked by ${existing.lockedBy} at ${existing.lockedAt}`);
  }
  const lockData = { vaultName, lockedBy, reason, lockedAt: new Date().toISOString() };
  fs.writeFileSync(lp, JSON.stringify(lockData, null, 2));
  return lockData;
}

function unlockVault(vaultName, requestedBy = 'unknown') {
  const lp = lockPath(vaultName);
  if (!fs.existsSync(lp)) {
    throw new Error(`Vault "${vaultName}" is not locked.`);
  }
  const lockData = JSON.parse(fs.readFileSync(lp, 'utf8'));
  fs.unlinkSync(lp);
  return { ...lockData, unlockedBy: requestedBy, unlockedAt: new Date().toISOString() };
}

function isLocked(vaultName) {
  return fs.existsSync(lockPath(vaultName));
}

function getLockInfo(vaultName) {
  const lp = lockPath(vaultName);
  if (!fs.existsSync(lp)) return null;
  return JSON.parse(fs.readFileSync(lp, 'utf8'));
}

function listLocks() {
  ensureLockDir();
  return fs.readdirSync(LOCK_DIR)
    .filter(f => f.endsWith('.lock'))
    .map(f => JSON.parse(fs.readFileSync(path.join(LOCK_DIR, f), 'utf8')));
}

module.exports = { ensureLockDir, lockVault, unlockVault, isLocked, getLockInfo, listLocks };
