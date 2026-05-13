const { isLocked, getLockInfo } = require('../env/envLock');

/**
 * Wraps a vault write operation with a lock check.
 * Throws if the target vault is currently locked.
 *
 * @param {string} vaultName - The vault identifier to guard.
 * @param {Function} writeFn - Async or sync function performing the write.
 * @returns {*} Result of writeFn if vault is not locked.
 */
function guardedWrite(vaultName, writeFn) {
  if (isLocked(vaultName)) {
    const info = getLockInfo(vaultName);
    throw new Error(
      `Write blocked: vault "${vaultName}" is locked by ${info.lockedBy} since ${info.lockedAt}` +
      (info.reason ? ` (${info.reason})` : '')
    );
  }
  return writeFn();
}

/**
 * Async version of guardedWrite.
 */
async function guardedWriteAsync(vaultName, writeFn) {
  if (isLocked(vaultName)) {
    const info = getLockInfo(vaultName);
    throw new Error(
      `Write blocked: vault "${vaultName}" is locked by ${info.lockedBy} since ${info.lockedAt}` +
      (info.reason ? ` (${info.reason})` : '')
    );
  }
  return writeFn();
}

module.exports = { guardedWrite, guardedWriteAsync };
