const { isLocked, getLockInfo } = require('../env/envLock');

/**
 * Builds a standardized lock error message for a given vault.
 *
 * @param {string} vaultName - The vault identifier.
 * @param {object} info - Lock info object from getLockInfo.
 * @returns {string} Formatted error message.
 */
function buildLockErrorMessage(vaultName, info) {
  return (
    `Write blocked: vault "${vaultName}" is locked by ${info.lockedBy} since ${info.lockedAt}` +
    (info.reason ? ` (${info.reason})` : '')
  );
}

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
    throw new Error(buildLockErrorMessage(vaultName, info));
  }
  return writeFn();
}

/**
 * Async version of guardedWrite.
 *
 * @param {string} vaultName - The vault identifier to guard.
 * @param {Function} writeFn - Async or sync function performing the write.
 * @returns {Promise<*>} Result of writeFn if vault is not locked.
 */
async function guardedWriteAsync(vaultName, writeFn) {
  if (isLocked(vaultName)) {
    const info = getLockInfo(vaultName);
    throw new Error(buildLockErrorMessage(vaultName, info));
  }
  return writeFn();
}

module.exports = { guardedWrite, guardedWriteAsync };
