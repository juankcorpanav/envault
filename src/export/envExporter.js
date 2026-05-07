const fs = require('fs');
const path = require('path');
const { readVault } = require('../vault/vaultAccess');
const { serializeEnv } = require('../secrets/envParser');
const { logAuditEvent } = require('../audit/auditLog');

/**
 * Exports a vault's secrets to a .env file on disk.
 * @param {string} vaultName - Name of the vault to export.
 * @param {string} outputPath - Destination file path.
 * @param {object} options - Export options.
 * @param {string[]} [options.keys] - Specific keys to export (exports all if omitted).
 * @param {boolean} [options.overwrite=false] - Whether to overwrite existing file.
 * @returns {string} The resolved output path.
 */
async function exportToFile(vaultName, outputPath, options = {}) {
  const { keys, overwrite = false } = options;

  const resolved = path.resolve(outputPath);

  if (!overwrite && fs.existsSync(resolved)) {
    throw new Error(`File already exists: ${resolved}. Use overwrite option to replace it.`);
  }

  const secrets = await readVault(vaultName);

  let filtered = secrets;
  if (Array.isArray(keys) && keys.length > 0) {
    filtered = {};
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(secrets, key)) {
        filtered[key] = secrets[key];
      }
    }
  }

  const content = serializeEnv(filtered);
  fs.writeFileSync(resolved, content, 'utf8');

  await logAuditEvent({
    action: 'export',
    vault: vaultName,
    detail: `Exported ${Object.keys(filtered).length} key(s) to ${resolved}`,
  });

  return resolved;
}

/**
 * Exports a vault's secrets as a plain JS object (for programmatic use).
 * @param {string} vaultName - Name of the vault to export.
 * @param {string[]} [keys] - Specific keys to include.
 * @returns {object} The secrets object.
 */
async function exportToObject(vaultName, keys) {
  const secrets = await readVault(vaultName);

  if (Array.isArray(keys) && keys.length > 0) {
    const filtered = {};
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(secrets, key)) {
        filtered[key] = secrets[key];
      }
    }
    return filtered;
  }

  return { ...secrets };
}

module.exports = { exportToFile, exportToObject };
