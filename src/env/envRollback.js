const path = require('path');
const { loadHistory } = require('./envHistory');
const { writeVault, readVault } = require('../vault/vaultAccess');
const { logAuditEvent } = require('../audit/auditLog');

/**
 * Get the list of rollback points for a given vault.
 * Each rollback point corresponds to a recorded history entry.
 */
function listRollbackPoints(vaultName) {
  const history = loadHistory(vaultName);
  return history.map((entry, index) => ({
    index,
    timestamp: entry.timestamp,
    action: entry.action,
    key: entry.key,
    previous: entry.previous,
    next: entry.next,
  }));
}

/**
 * Preview what the vault env would look like after rolling back to a given history index.
 * Returns the reconstructed env object at that point in time.
 */
function previewRollback(vaultName, targetIndex) {
  const history = loadHistory(vaultName);
  if (targetIndex < 0 || targetIndex >= history.length) {
    throw new Error(`Invalid rollback index: ${targetIndex}`);
  }

  const current = readVault(vaultName);
  const env = Object.assign({}, current);

  // Undo history entries from newest down to targetIndex (inclusive)
  for (let i = history.length - 1; i >= targetIndex; i--) {
    const entry = history[i];
    if (entry.action === 'set') {
      if (entry.previous === undefined || entry.previous === null) {
        delete env[entry.key];
      } else {
        env[entry.key] = entry.previous;
      }
    } else if (entry.action === 'delete') {
      if (entry.previous !== undefined && entry.previous !== null) {
        env[entry.key] = entry.previous;
      }
    }
  }

  return env;
}

/**
 * Perform a rollback of the vault to a given history index.
 * Writes the reconstructed state and logs the audit event.
 */
function rollbackVault(vaultName, targetIndex) {
  const rolledBack = previewRollback(vaultName, targetIndex);
  writeVault(vaultName, rolledBack);
  logAuditEvent({
    action: 'rollback',
    vault: vaultName,
    targetIndex,
    timestamp: new Date().toISOString(),
  });
  return rolledBack;
}

module.exports = { listRollbackPoints, previewRollback, rollbackVault };
