const { listExpired } = require('./envExpiry');
const { logAuditEvent } = require('../audit/auditLog');

/**
 * Notifier that checks for expired keys and emits audit events.
 * Can be composed with other notifiers or called on vault read.
 */
function expiryNotifier(vaultName, env) {
  const expired = listExpired(vaultName);
  if (expired.length === 0) return { expired: [] };

  expired.forEach(({ key, expiresAt }) => {
    logAuditEvent({
      action: 'KEY_EXPIRED',
      vault: vaultName,
      key,
      expiresAt,
      timestamp: new Date().toISOString()
    });
  });

  return { expired };
}

/**
 * Higher-order function: wraps a vault read function to notify on expiry.
 * @param {Function} readFn - async or sync function that returns env object
 * @returns {Function}
 */
function withExpiryCheck(readFn) {
  return function wrappedRead(vaultName, ...args) {
    const env = readFn(vaultName, ...args);
    const { expired } = expiryNotifier(vaultName, env);
    if (expired.length > 0) {
      const keys = expired.map((e) => e.key).join(', ');
      console.warn(`[envault] Warning: expired keys in vault "${vaultName}": ${keys}`);
    }
    return env;
  };
}

/**
 * Format a single expiry notification entry for display.
 */
function formatExpiryEntry({ key, expiresAt }) {
  const ago = Math.floor((Date.now() - new Date(expiresAt).getTime()) / 1000);
  return `Key "${key}" expired ${ago}s ago (at ${expiresAt})`;
}

module.exports = { expiryNotifier, withExpiryCheck, formatExpiryEntry };
