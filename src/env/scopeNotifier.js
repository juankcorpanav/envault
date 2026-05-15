/**
 * scopeNotifier.js — Notifiers/middleware for scope-related operations
 */

const { logAuditEvent } = require('../audit/auditLog');

/**
 * Audit notifier for scope changes.
 * @param {string} vault
 * @param {string} action - 'assign' | 'remove'
 * @param {string} key
 * @param {string} scope
 */
function scopeAuditNotifier(vault, action, key, scope) {
  logAuditEvent({
    vault,
    action: `scope:${action}`,
    key,
    scope,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Wraps assignScope/removeFromScope with audit logging.
 * @param {Function} fn - the scope operation function
 * @param {string} actionName
 * @returns {Function}
 */
function withScopeAudit(fn, actionName) {
  return function (vault, key, scope, ...rest) {
    const result = fn(vault, key, scope, ...rest);
    scopeAuditNotifier(vault, actionName, key, scope);
    return result;
  };
}

/**
 * Console notifier for scope changes.
 */
function consoleScopeNotifier(vault, action, key, scope) {
  console.log(`[scope] ${action}: key="${key}" scope="${scope}" vault="${vault}"`);
}

/**
 * Compose multiple scope notifiers into one.
 * @param {...Function} notifiers
 * @returns {Function}
 */
function composeScopeNotifiers(...notifiers) {
  return function (vault, action, key, scope) {
    for (const notifier of notifiers) {
      notifier(vault, action, key, scope);
    }
  };
}

module.exports = {
  scopeAuditNotifier,
  withScopeAudit,
  consoleScopeNotifier,
  composeScopeNotifiers,
};
