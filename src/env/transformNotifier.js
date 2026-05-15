const { logAuditEvent } = require('../audit/auditLog');

/**
 * Wraps transformEnv to emit an audit event listing which keys were transformed.
 * @param {Function} transformFn - the core transformEnv function
 * @param {object} options
 * @param {string} options.vault  - vault identifier for audit context
 * @param {string} [options.actor] - actor performing the transform
 * @returns {Function} wrapped transform function with same signature
 */
function withTransformAudit(transformFn, { vault, actor = 'system' } = {}) {
  return function auditedTransform(parsed, rules) {
    const result = transformFn(parsed, rules);
    const affectedKeys = Object.keys(rules).filter((k) => k in parsed);
    if (affectedKeys.length > 0) {
      logAuditEvent({
        action: 'transform',
        vault,
        actor,
        detail: { keys: affectedKeys, transforms: rules },
        timestamp: new Date().toISOString(),
      });
    }
    return result;
  };
}

/**
 * A notifier that logs a summary of transform operations to console.
 * @param {string[]} keys - keys that were transformed
 * @param {object} rules  - the rules map applied
 */
function consoleTransformNotifier(keys, rules) {
  if (keys.length === 0) return;
  const summary = keys.map((k) => {
    const spec = Array.isArray(rules[k]) ? rules[k].join(' → ') : rules[k];
    return `  ${k}: ${spec}`;
  }).join('\n');
  console.log(`[envault] Transforms applied:\n${summary}`);
}

/**
 * Composes multiple notifier callbacks into one.
 * @param {...Function} notifiers
 * @returns {Function}
 */
function composeTransformNotifiers(...notifiers) {
  return (keys, rules) => notifiers.forEach((n) => n(keys, rules));
}

module.exports = { withTransformAudit, consoleTransformNotifier, composeTransformNotifiers };
