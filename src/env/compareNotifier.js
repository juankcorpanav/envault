/**
 * compareNotifier.js
 * Notifier hooks for env comparison events, integrating with auditLog and envHooks.
 */

const { logAuditEvent } = require('../audit/auditLog');
const { listHooks } = require('../hooks/envHooks');
const { changedKeys } = require('./envCompare');

/**
 * Emit a comparison result through registered hooks and audit log.
 * @param {string} label  Human-readable label for the comparison (e.g. "dev vs prod")
 * @param {object} envA
 * @param {object} envB
 * @param {string} [vaultId]
 */
function notifyComparison(label, envA, envB, vaultId = 'compare') {
  const keys = changedKeys(envA, envB);
  const payload = { label, changedKeys: keys, count: keys.length };

  logAuditEvent({
    action: 'compare',
    vaultId,
    meta: payload
  });

  const hooks = listHooks('compare');
  for (const hook of hooks) {
    try {
      hook.handler(payload);
    } catch (err) {
      // hooks must not crash the caller
      console.warn(`[compareNotifier] hook "${hook.name}" failed: ${err.message}`);
    }
  }

  return payload;
}

/**
 * Middleware-style wrapper: run comparison and notify, returning the diff result.
 * @param {Function} compareFn  One of compareProfiles / compareVaults / compareProfileToVault
 * @param {string} label
 * @param  {...any} args  Arguments forwarded to compareFn
 * @returns {{ diff: object, summary: string, notification: object }}
 */
function withCompareNotifier(compareFn, label, ...args) {
  const result = compareFn(...args);
  const [envA, envB] = args.length >= 2
    ? [args[0], args[1]]
    : [{}, {}];
  const notification = notifyComparison(label, envA, envB);
  return { ...result, notification };
}

module.exports = { notifyComparison, withCompareNotifier };
