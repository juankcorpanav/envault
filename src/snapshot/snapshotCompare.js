const { loadSnapshot } = require('./envSnapshot');
const { diffEnv, formatDiff, hasDiff } = require('../diff/envDiff');

/**
 * Compare two snapshots by their IDs and return the diff result.
 * @param {string} vaultName
 * @param {string} snapshotIdA
 * @param {string} snapshotIdB
 * @returns {{ diff: object, formatted: string, hasChanges: boolean }}
 */
function compareSnapshots(vaultName, snapshotIdA, snapshotIdB) {
  const snapshotA = loadSnapshot(vaultName, snapshotIdA);
  const snapshotB = loadSnapshot(vaultName, snapshotIdB);

  if (!snapshotA) {
    throw new Error(`Snapshot not found: ${snapshotIdA}`);
  }
  if (!snapshotB) {
    throw new Error(`Snapshot not found: ${snapshotIdB}`);
  }

  const envA = snapshotA.env || {};
  const envB = snapshotB.env || {};

  const diff = diffEnv(envA, envB);
  const formatted = formatDiff(diff);
  const hasChanges = hasDiff(diff);

  return { diff, formatted, hasChanges };
}

/**
 * Compare a snapshot against the current vault env object.
 * @param {string} vaultName
 * @param {string} snapshotId
 * @param {object} currentEnv
 * @returns {{ diff: object, formatted: string, hasChanges: boolean }}
 */
function compareSnapshotToCurrent(vaultName, snapshotId, currentEnv) {
  const snapshot = loadSnapshot(vaultName, snapshotId);

  if (!snapshot) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const envA = snapshot.env || {};
  const diff = diffEnv(envA, currentEnv);
  const formatted = formatDiff(diff);
  const hasChanges = hasDiff(diff);

  return { diff, formatted, hasChanges };
}

module.exports = { compareSnapshots, compareSnapshotToCurrent };
