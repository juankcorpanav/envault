const fs = require('fs');
const path = require('path');
const { parseEnv, serializeEnv } = require('../secrets/envParser');
const { writeVault } = require('../vault/vaultAccess');
const { logAuditEvent } = require('../audit/auditLog');

/**
 * Reads and parses a .env file from disk.
 * @param {string} filePath - Absolute or relative path to the .env file.
 * @returns {Object} Parsed key-value pairs.
 */
function readEnvFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, 'utf8');
  return parseEnv(raw);
}

/**
 * Merges imported env vars into an existing vault, optionally overwriting duplicates.
 * @param {Object} existing - Current vault contents.
 * @param {Object} incoming - Parsed env vars to import.
 * @param {boolean} overwrite - Whether to overwrite existing keys.
 * @returns {Object} Merged result.
 */
function mergeEnv(existing, incoming, overwrite = false) {
  if (overwrite) {
    return { ...existing, ...incoming };
  }
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in merged)) {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Imports a .env file into a named vault.
 * @param {string} vaultName - Target vault identifier.
 * @param {string} filePath - Path to the .env file.
 * @param {Object} options - { overwrite: boolean }
 * @returns {Object} Summary of imported keys.
 */
async function importEnvToVault(vaultName, filePath, options = {}) {
  const { overwrite = false } = options;
  const incoming = readEnvFile(filePath);
  const incomingKeys = Object.keys(incoming);

  let existing = {};
  try {
    const { readVault } = require('../vault/vaultAccess');
    existing = await readVault(vaultName);
  } catch (_) {
    // Vault may not exist yet; start fresh
  }

  const merged = mergeEnv(existing, incoming, overwrite);
  await writeVault(vaultName, merged);

  await logAuditEvent({
    action: 'import',
    vault: vaultName,
    keys: incomingKeys,
    overwrite,
    timestamp: new Date().toISOString(),
  });

  return {
    imported: incomingKeys.length,
    skipped: incomingKeys.filter((k) => k in existing && !overwrite).length,
    overwritten: incomingKeys.filter((k) => k in existing && overwrite).length,
  };
}

module.exports = { readEnvFile, mergeEnv, importEnvToVault };
