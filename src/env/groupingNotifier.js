/**
 * groupingNotifier.js — Notifier integration for env key grouping events
 */

const { logAuditEvent } = require('../audit/auditLog');

/**
 * Notifier that logs group changes to the audit log.
 * @param {string} event - 'add' | 'remove' | 'delete'
 * @param {string} groupName
 * @param {string|null} key
 * @param {string} vaultId
 */
function groupingAuditNotifier(event, groupName, key, vaultId = 'default') {
  const detail = key ? `key=${key}` : 'group';
  logAuditEvent({
    vault: vaultId,
    action: `group:${event}`,
    target: groupName,
    detail,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Higher-order wrapper that fires a notifier after a grouping operation.
 * @param {Function} fn - The grouping operation to wrap
 * @param {string} event - Event label
 * @param {Function[]} notifiers - Array of notifier functions
 */
function withGroupingNotifiers(fn, event, notifiers = []) {
  return function (...args) {
    const result = fn(...args);
    notifiers.forEach(notify => {
      try {
        notify(event, ...args);
      } catch (e) {
        // notifiers should not break core operations
      }
    });
    return result;
  };
}

/**
 * Format a grouping event for display or logging.
 * @param {string} event
 * @param {string} groupName
 * @param {string|null} key
 */
function formatGroupingEntry(event, groupName, key) {
  const keyPart = key ? ` [key: ${key}]` : '';
  return `[group:${event}] group="${groupName}"${keyPart}`;
}

module.exports = {
  groupingAuditNotifier,
  withGroupingNotifiers,
  formatGroupingEntry,
};
