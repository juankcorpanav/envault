const fs = require('fs');
const path = require('path');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

const VAULT_DIR = process.env.ENVAULT_DIR || path.join(process.cwd(), '.envault');

/**
 * Reads and parses a vault's .env file by vault name.
 * @param {string} vaultName
 * @returns {Object} parsed key-value pairs
 */
function readVault(vaultName) {
  const vaultPath = path.join(VAULT_DIR, vaultName, '.env');
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultName}`);
  }
  const raw = fs.readFileSync(vaultPath, 'utf-8');
  return parseEnv(raw);
}

/**
 * Writes key-value pairs to a vault's .env file.
 * Creates the vault directory if it does not exist.
 * @param {string} vaultName
 * @param {Object} envData key-value pairs
 */
function writeVault(vaultName, envData) {
  if (!vaultName || typeof vaultName !== 'string') {
    throw new Error('Invalid vault name');
  }
  const vaultPath = path.join(VAULT_DIR, vaultName);
  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }
  const serialized = serializeEnv(envData);
  fs.writeFileSync(path.join(vaultPath, '.env'), serialized, 'utf-8');
}

/**
 * Updates specific keys in an existing vault without overwriting others.
 * @param {string} vaultName
 * @param {Object} updates key-value pairs to merge
 * @returns {Object} merged env data
 */
function updateVault(vaultName, updates) {
  const existing = fs.existsSync(path.join(VAULT_DIR, vaultName, '.env'))
    ? readVault(vaultName)
    : {};
  const merged = { ...existing, ...updates };
  writeVault(vaultName, merged);
  return merged;
}

/**
 * Deletes a specific key from a vault.
 * @param {string} vaultName
 * @param {string} key
 * @returns {Object} updated env data
 */
function deleteVaultKey(vaultName, key) {
  const existing = readVault(vaultName);
  if (!(key in existing)) {
    throw new Error(`Key "${key}" not found in vault: ${vaultName}`);
  }
  delete existing[key];
  writeVault(vaultName, existing);
  return existing;
}

module.exports = { readVault, writeVault, updateVault, deleteVaultKey };
