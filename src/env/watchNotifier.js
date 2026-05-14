/**
 * watchNotifier.js
 * Built-in notification strategies triggered by envWatch change events.
 */
const { diffEnv, hasDiff } = require('../diff/envDiff');
const { logAuditEvent } = require('../audit/auditLog');

/**
 * Create a change handler that logs added/removed/changed key counts to audit.
 * @param {object} options
 * @param {boolean} [options.logAdded=true]
 * @param {boolean} [options.logRemoved=true]
 * @param {boolean} [options.logChanged=true]
 * @returns {function}
 */
function auditNotifier(options = {}) {
  const { logAdded = true, logRemoved = true, logChanged = true } = options;
  return function (vaultName, oldEnv, newEnv) {
    const diff = diffEnv(oldEnv, newEnv);
    if (!hasDiff(diff)) return;
    const summary = {};
    if (logAdded && diff.added.length) summary.added = diff.added.length;
    if (logRemoved && diff.removed.length) summary.removed = diff.removed.length;
    if (logChanged && diff.changed.length) summary.changed = diff.changed.length;
    logAuditEvent(vaultName, 'watch:diff', summary);
  };
}

/**
 * Create a change handler that calls a user-supplied callback only when
 * specific keys change.
 * @param {string[]} keys - keys to watch
 * @param {function} callback - called with (vaultName, changedKeys)
 * @returns {function}
 */
function keyWatcher(keys, callback) {
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('keyWatcher requires a non-empty array of keys');
  }
  return function (vaultName, oldEnv, newEnv) {
    const diff = diffEnv(oldEnv, newEnv);
    const allChanged = [
      ...diff.added,
      ...diff.removed,
      ...diff.changed.map((c) => c.key),
    ];
    const matched = allChanged.filter((k) => keys.includes(k));
    if (matched.length > 0 && typeof callback === 'function') {
      callback(vaultName, matched);
    }
  };
}

/**
 * Compose multiple notifier handlers into one.
 * @param {...function} handlers
 * @returns {function}
 */
function composeNotifiers(...handlers) {
  return function (vaultName, oldEnv, newEnv) {
    for (const handler of handlers) {
      handler(vaultName, oldEnv, newEnv);
    }
  };
}

module.exports = { auditNotifier, keyWatcher, composeNotifiers };
