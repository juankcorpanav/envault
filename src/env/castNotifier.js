/**
 * castNotifier.js — Notifier utilities for env cast operations
 * Provides audit trail and console feedback for cast actions.
 */

const { logAuditEvent } = require('../audit/auditLog');

function consoleCastNotifier(key, from, to, type) {
  console.log(`[cast] ${key}: "${from}" => ${JSON.stringify(to)} (${type})`);
}

function auditCastNotifier(vaultName) {
  return function (key, from, to, type) {
    logAuditEvent({
      vault: vaultName,
      action: 'cast',
      key,
      detail: { from, to: JSON.stringify(to), type },
      timestamp: new Date().toISOString(),
    });
  };
}

function composeCastNotifiers(...notifiers) {
  return function (key, from, to, type) {
    for (const notify of notifiers) {
      try {
        notify(key, from, to, type);
      } catch {
        // individual notifier failures should not block others
      }
    }
  };
}

function withCastNotifier(castFn, notify) {
  return function (env, schema) {
    const result = castFn(env, schema);
    for (const key of Object.keys(schema)) {
      if (key in env && key in result) {
        notify(key, env[key], result[key], schema[key]);
      }
    }
    return result;
  };
}

module.exports = {
  consoleCastNotifier,
  auditCastNotifier,
  composeCastNotifiers,
  withCastNotifier,
};
