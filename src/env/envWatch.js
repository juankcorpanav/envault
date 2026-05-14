const fs = require('fs');
const path = require('path');
const { parseEnv } = require('../secrets/envParser');
const { logAuditEvent } = require('../audit/auditLog');

const watchers = new Map();

/**
 * Start watching a .env file for changes.
 * @param {string} vaultName
 * @param {string} filePath
 * @param {function} onChange - called with (vaultName, oldEnv, newEnv)
 * @returns {object} watcher handle
 */
function watchEnvFile(vaultName, filePath, onChange) {
  if (watchers.has(vaultName)) {
    throw new Error(`Already watching vault: ${vaultName}`);
  }

  let lastContent = null;
  try {
    lastContent = fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    lastContent = '';
  }

  const watcher = fs.watch(filePath, { persistent: false }, (eventType) => {
    if (eventType !== 'change') return;
    try {
      const newContent = fs.readFileSync(filePath, 'utf8');
      if (newContent === lastContent) return;
      const oldEnv = parseEnv(lastContent);
      const newEnv = parseEnv(newContent);
      lastContent = newContent;
      logAuditEvent(vaultName, 'watch:change', { filePath });
      if (typeof onChange === 'function') onChange(vaultName, oldEnv, newEnv);
    } catch (err) {
      // ignore read errors during rapid saves
    }
  });

  watchers.set(vaultName, { watcher, filePath });
  return watcher;
}

/**
 * Stop watching a vault file.
 * @param {string} vaultName
 */
function unwatchEnvFile(vaultName) {
  const entry = watchers.get(vaultName);
  if (!entry) return false;
  entry.watcher.close();
  watchers.delete(vaultName);
  return true;
}

/**
 * List all currently watched vaults.
 * @returns {Array<{vaultName: string, filePath: string}>}
 */
function listWatched() {
  return Array.from(watchers.entries()).map(([vaultName, { filePath }]) => ({
    vaultName,
    filePath,
  }));
}

/**
 * Stop all active watchers.
 */
function clearWatchers() {
  for (const [, { watcher }] of watchers) {
    watcher.close();
  }
  watchers.clear();
}

module.exports = { watchEnvFile, unwatchEnvFile, listWatched, clearWatchers };
