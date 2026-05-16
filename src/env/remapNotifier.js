/**
 * remapNotifier.js
 * Notifier utilities for env remapping operations.
 */

const { logAuditEvent } = require('../audit/auditLog');

/**
 * Console notifier: logs remap results to stdout.
 */
function consoleRemapNotifier({ profile, original, remapped, dropped }) {
  const remappedCount = Object.keys(remapped).length;
  const droppedCount = dropped ? dropped.length : 0;
  console.log(`[remap] Profile "${profile}" applied: ${remappedCount} key(s) in result, ${droppedCount} dropped.`);
}

/**
 * Audit notifier: writes a remap event to the audit log.
 */
function auditRemapNotifier({ profile, original, remapped, dropped, vault }) {
  logAuditEvent({
    action: 'remap_applied',
    vault: vault || 'unknown',
    profile,
    originalCount: Object.keys(original).length,
    remappedCount: Object.keys(remapped).length,
    droppedKeys: dropped || [],
    timestamp: new Date().toISOString(),
  });
}

/**
 * Compose multiple notifiers into one.
 */
function composeRemapNotifiers(...notifiers) {
  return (event) => notifiers.forEach(n => n(event));
}

/**
 * Higher-order function: wraps applyRemap with notification.
 */
function withRemapNotifier(applyRemapFn, notifier) {
  return function (env, mapping, options = {}) {
    const remapped = applyRemapFn(env, mapping, options);
    const dropped = options.dropUnmapped
      ? Object.keys(env).filter(k => !mapping[k])
      : [];
    notifier({
      profile: options.profile || 'inline',
      original: env,
      remapped,
      dropped,
      vault: options.vault,
    });
    return remapped;
  };
}

module.exports = {
  consoleRemapNotifier,
  auditRemapNotifier,
  composeRemapNotifiers,
  withRemapNotifier,
};
