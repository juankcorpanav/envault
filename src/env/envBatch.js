const { readVault, writeVault } = require('../vault/vaultAccess');
const { isLocked } = require('./envLock');
const { recordChange } = require('./envHistory');

/**
 * Supported batch operation types.
 */
const BATCH_OPS = ['set', 'delete', 'rename'];

function listBatchOps() {
  return [...BATCH_OPS];
}

/**
 * Validate a single batch operation descriptor.
 * @param {object} op
 * @returns {{ valid: boolean, error?: string }}
 */
function validateOp(op) {
  if (!op || typeof op !== 'object') return { valid: false, error: 'Operation must be an object' };
  if (!BATCH_OPS.includes(op.type)) return { valid: false, error: `Unknown operation type: ${op.type}` };
  if (typeof op.key !== 'string' || !op.key.trim()) return { valid: false, error: 'Operation must have a non-empty key' };
  if (op.type === 'set' && (op.value === undefined || op.value === null)) return { valid: false, error: 'set operation requires a value' };
  if (op.type === 'rename' && (typeof op.newKey !== 'string' || !op.newKey.trim())) return { valid: false, error: 'rename operation requires a newKey' };
  return { valid: true };
}

/**
 * Apply a list of batch operations to a vault.
 * @param {string} vaultPath
 * @param {Array<{type: string, key: string, value?: string, newKey?: string}>} ops
 * @param {{ dryRun?: boolean }} options
 * @returns {{ applied: number, skipped: number, results: Array }}
 */
async function applyBatch(vaultPath, ops, options = {}) {
  if (!Array.isArray(ops) || ops.length === 0) throw new Error('ops must be a non-empty array');
  if (isLocked(vaultPath)) throw new Error(`Vault is locked: ${vaultPath}`);

  const results = [];
  let applied = 0;
  let skipped = 0;

  const env = await readVault(vaultPath);
  const updated = { ...env };

  for (const op of ops) {
    const { valid, error } = validateOp(op);
    if (!valid) {
      results.push({ op, status: 'skipped', reason: error });
      skipped++;
      continue;
    }

    if (op.type === 'set') {
      updated[op.key] = String(op.value);
      results.push({ op, status: 'applied' });
      applied++;
    } else if (op.type === 'delete') {
      if (!(op.key in updated)) {
        results.push({ op, status: 'skipped', reason: 'Key not found' });
        skipped++;
      } else {
        delete updated[op.key];
        results.push({ op, status: 'applied' });
        applied++;
      }
    } else if (op.type === 'rename') {
      if (!(op.key in updated)) {
        results.push({ op, status: 'skipped', reason: 'Key not found' });
        skipped++;
      } else {
        updated[op.newKey] = updated[op.key];
        delete updated[op.key];
        results.push({ op, status: 'applied' });
        applied++;
      }
    }
  }

  if (!options.dryRun && applied > 0) {
    await writeVault(vaultPath, updated);
    await recordChange(vaultPath, 'batch', { applied, ops: results.filter(r => r.status === 'applied').map(r => r.op) });
  }

  return { applied, skipped, results };
}

module.exports = { listBatchOps, validateOp, applyBatch };
