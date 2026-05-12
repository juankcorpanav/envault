/**
 * builtinHooks.js — Built-in hook implementations for common use cases
 * These can be registered via registerHook() to add audit logging,
 * validation, or notification behavior automatically.
 */

const { logAuditEvent } = require('../audit/auditLog');

/**
 * Audit hook: logs a read event after a vault is read.
 * @param {object} ctx - { vaultName, env }
 */
async function auditPostReadHook(ctx) {
  await logAuditEvent({
    event: 'read',
    vault: ctx.vaultName,
    timestamp: new Date().toISOString(),
    meta: { keys: ctx.env ? Object.keys(ctx.env).length : 0 },
  });
}

/**
 * Audit hook: logs a write event after a vault is written.
 * @param {object} ctx - { vaultName, env }
 */
async function auditPostWriteHook(ctx) {
  await logAuditEvent({
    event: 'write',
    vault: ctx.vaultName,
    timestamp: new Date().toISOString(),
    meta: { keys: ctx.env ? Object.keys(ctx.env).length : 0 },
  });
}

/**
 * Audit hook: logs a rotate event after a secret is rotated.
 * @param {object} ctx - { vaultName, key }
 */
async function auditPostRotateHook(ctx) {
  await logAuditEvent({
    event: 'rotate',
    vault: ctx.vaultName,
    timestamp: new Date().toISOString(),
    meta: { key: ctx.key },
  });
}

/**
 * Validation hook: warns if any env value looks like a plaintext secret.
 * Runs pre-write. Does not block — only logs a warning.
 * @param {object} ctx - { vaultName, env }
 */
async function warnPlaintextSecretsHook(ctx) {
  const sensitivePattern = /password|secret|token|key/i;
  const weakValuePattern = /^[a-zA-Z0-9]{1,8}$/;
  if (ctx.env) {
    for (const [k, v] of Object.entries(ctx.env)) {
      if (sensitivePattern.test(k) && weakValuePattern.test(v)) {
        console.warn(`[envault warn] Key "${k}" may have a weak or plaintext secret value.`);
      }
    }
  }
}

module.exports = {
  auditPostReadHook,
  auditPostWriteHook,
  auditPostRotateHook,
  warnPlaintextSecretsHook,
};
