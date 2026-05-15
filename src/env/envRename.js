const { readVault, writeVault } = require('../vault/vaultAccess');
const { isLocked } = require('./envLock');
const { recordChange } = require('./envHistory');

/**
 * Rename a key in a vault, preserving its value.
 * @param {string} vaultName
 * @param {string} oldKey
 * @param {string} newKey
 * @param {object} [options]
 * @param {boolean} [options.overwrite=false] - overwrite newKey if it already exists
 * @returns {{ oldKey: string, newKey: string, value: string }}
 */
async function renameKey(vaultName, oldKey, newKey, options = {}) {
  const { overwrite = false } = options;

  if (!oldKey || typeof oldKey !== 'string') throw new Error('oldKey must be a non-empty string');
  if (!newKey || typeof newKey !== 'string') throw new Error('newKey must be a non-empty string');
  if (oldKey === newKey) throw new Error('oldKey and newKey must be different');

  if (await isLocked(vaultName)) {
    throw new Error(`Vault "${vaultName}" is locked and cannot be modified`);
  }

  const env = await readVault(vaultName);

  if (!(oldKey in env)) {
    throw new Error(`Key "${oldKey}" not found in vault "${vaultName}"`);
  }

  if (newKey in env && !overwrite) {
    throw new Error(`Key "${newKey}" already exists. Use overwrite option to replace it`);
  }

  const value = env[oldKey];
  const updated = { ...env };
  delete updated[oldKey];
  updated[newKey] = value;

  await writeVault(vaultName, updated);

  await recordChange(vaultName, 'rename', { oldKey, newKey, value });

  return { oldKey, newKey, value };
}

/**
 * Bulk rename keys using a mapping object { oldKey: newKey }.
 * @param {string} vaultName
 * @param {Record<string, string>} mapping
 * @param {object} [options]
 * @returns {Array<{ oldKey: string, newKey: string, value: string }>}
 */
async function bulkRenameKeys(vaultName, mapping, options = {}) {
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    throw new Error('mapping must be a plain object');
  }

  const entries = Object.entries(mapping);
  if (entries.length === 0) throw new Error('mapping must have at least one entry');

  if (await isLocked(vaultName)) {
    throw new Error(`Vault "${vaultName}" is locked and cannot be modified`);
  }

  const env = await readVault(vaultName);
  const { overwrite = false } = options;
  const results = [];
  const updated = { ...env };

  for (const [oldKey, newKey] of entries) {
    if (!(oldKey in updated)) throw new Error(`Key "${oldKey}" not found in vault "${vaultName}"`);
    if (oldKey === newKey) throw new Error(`oldKey and newKey must be different ("${oldKey}")`);
    if (newKey in updated && !overwrite) {
      throw new Error(`Key "${newKey}" already exists. Use overwrite option to replace it`);
    }
    const value = updated[oldKey];
    delete updated[oldKey];
    updated[newKey] = value;
    results.push({ oldKey, newKey, value });
  }

  await writeVault(vaultName, updated);
  await recordChange(vaultName, 'bulk-rename', { mapping });

  return results;
}

module.exports = { renameKey, bulkRenameKeys };
