const { createSnapshot } = require('./envSnapshot');
const { readVault } = require('../vault/vaultAccess');
const { logAuditEvent } = require('../audit/auditLog');

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const activeTimers = new Map();

function scheduleSnapshot(vaultName, intervalMs = DEFAULT_INTERVAL_MS) {
  if (activeTimers.has(vaultName)) {
    clearInterval(activeTimers.get(vaultName));
  }

  const timer = setInterval(() => {
    try {
      const env = readVault(vaultName);
      const snapshotId = createSnapshot(vaultName, env);
      logAuditEvent({
        action: 'scheduled_snapshot',
        vault: vaultName,
        snapshotId,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[snapshotScheduler] Failed to snapshot vault "${vaultName}": ${err.message}`);
    }
  }, intervalMs);

  activeTimers.set(vaultName, timer);
  return timer;
}

function cancelSchedule(vaultName) {
  if (!activeTimers.has(vaultName)) return false;
  clearInterval(activeTimers.get(vaultName));
  activeTimers.delete(vaultName);
  return true;
}

function listScheduled() {
  return Array.from(activeTimers.keys());
}

module.exports = { scheduleSnapshot, cancelSchedule, listScheduled };
