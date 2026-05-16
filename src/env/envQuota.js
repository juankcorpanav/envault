const fs = require('fs');
const path = require('path');

const QUOTA_DIR = path.join(process.cwd(), '.envault', 'quotas');

function ensureQuotaDir() {
  if (!fs.existsSync(QUOTA_DIR)) {
    fs.mkdirSync(QUOTA_DIR, { recursive: true });
  }
}

function quotaFilePath(vaultName) {
  return path.join(QUOTA_DIR, `${vaultName}.quota.json`);
}

function loadQuota(vaultName) {
  ensureQuotaDir();
  const fp = quotaFilePath(vaultName);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function saveQuota(vaultName, quota) {
  ensureQuotaDir();
  fs.writeFileSync(quotaFilePath(vaultName), JSON.stringify(quota, null, 2), 'utf8');
}

function setQuota(vaultName, { maxKeys = null, maxValueLength = null } = {}) {
  if (maxKeys !== null && (typeof maxKeys !== 'number' || maxKeys < 1)) {
    throw new Error('maxKeys must be a positive integer');
  }
  if (maxValueLength !== null && (typeof maxValueLength !== 'number' || maxValueLength < 1)) {
    throw new Error('maxValueLength must be a positive integer');
  }
  const quota = { vaultName, maxKeys, maxValueLength, updatedAt: new Date().toISOString() };
  saveQuota(vaultName, quota);
  return quota;
}

function removeQuota(vaultName) {
  const fp = quotaFilePath(vaultName);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

function checkQuota(vaultName, env) {
  const quota = loadQuota(vaultName);
  if (!quota) return { passed: true, violations: [] };

  const violations = [];
  const keys = Object.keys(env);

  if (quota.maxKeys !== null && keys.length > quota.maxKeys) {
    violations.push(`Key count ${keys.length} exceeds limit of ${quota.maxKeys}`);
  }

  if (quota.maxValueLength !== null) {
    for (const [k, v] of Object.entries(env)) {
      if (String(v).length > quota.maxValueLength) {
        violations.push(`Value for "${k}" (${String(v).length} chars) exceeds max length of ${quota.maxValueLength}`);
      }
    }
  }

  return { passed: violations.length === 0, violations };
}

module.exports = { ensureQuotaDir, quotaFilePath, loadQuota, saveQuota, setQuota, removeQuota, checkQuota };
