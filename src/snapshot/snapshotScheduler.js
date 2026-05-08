import { createSnapshot } from './envSnapshot.js';

/** @type {Map<string, { intervalId: ReturnType<typeof setInterval>, intervalMs: number }>} */
const activeSchedules = new Map();

/**
 * Schedule automatic snapshots for a vault at a fixed interval.
 * If a schedule already exists for the vault, it is replaced.
 * @param {string} vaultName
 * @param {number} intervalMs - Interval in milliseconds
 * @returns {{ vaultName: string, intervalMs: number, active: boolean }}
 */
export function scheduleSnapshot(vaultName, intervalMs) {
  if (activeSchedules.has(vaultName)) {
    clearInterval(activeSchedules.get(vaultName).intervalId);
  }

  const intervalId = setInterval(async () => {
    try {
      await createSnapshot(vaultName);
    } catch (err) {
      console.error(`[snapshotScheduler] Failed to create snapshot for "${vaultName}": ${err.message}`);
    }
  }, intervalMs);

  activeSchedules.set(vaultName, { intervalId, intervalMs });

  return { vaultName, intervalMs, active: true };
}

/**
 * Cancel the scheduled snapshot for a vault.
 * @param {string} vaultName
 * @returns {boolean} true if a schedule was cancelled, false if none existed
 */
export function cancelSchedule(vaultName) {
  if (!activeSchedules.has(vaultName)) {
    return false;
  }
  clearInterval(activeSchedules.get(vaultName).intervalId);
  activeSchedules.delete(vaultName);
  return true;
}

/**
 * List all currently active snapshot schedules.
 * @returns {Array<{ vaultName: string, intervalMs: number, active: boolean }>}
 */
export function listScheduled() {
  return Array.from(activeSchedules.entries()).map(([vaultName, { intervalMs }]) => ({
    vaultName,
    intervalMs,
    active: true
  }));
}
