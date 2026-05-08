const { loadSnapshot } = require('./envSnapshot');
const { writeVault } = require('../vault/vaultAccess');
const { diffEnv, hasDiff } = require('../diff/envDiff');
const { logAuditEvent } = require('../audit/auditLog');

function previewRestore(snapshotId, currentEnv) {
  const snapshot = loadSnapshot(snapshotId);
  const diff = diffEnv(currentEnv, snapshot.env);
  return {
    snapshotId,
    vaultName: snapshot.vaultName,
    timestamp: snapshot.timestamp,
    diff,
    hasDiff: hasDiff(diff),
  };
}

function restoreSnapshot(snapshotId, currentEnv) {
  const snapshot = loadSnapshot(snapshotId);
  const { vaultName, env, timestamp } = snapshot;

  if (!hasDiff(diffEnv(currentEnv, env))) {
    return { restored: false, reason: 'No differences detected; vault already matches snapshot.' };
  }

  writeVault(vaultName, env);

  logAuditEvent({
    action: 'snapshot_restore',
    vault: vaultName,
    snapshotId,
    snapshotTimestamp: timestamp,
    restoredAt: new Date().toISOString(),
  });

  return { restored: true, vaultName, snapshotId };
}

module.exports = { previewRestore, restoreSnapshot };
