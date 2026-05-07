const fs = require('fs');
const path = require('path');
const { parseEnv, serializeEnv } = require('../secrets/envParser');
const { encryptEnv, decryptEnv } = require('../sharing/teamShare');

const DEFAULT_VAULT_DIR = '.envault';
const VAULT_EXTENSION = '.vault';

/**
 * Saves an encrypted .env file to the vault.
 * @param {string} envContent - Raw .env file content
 * @param {string} envName - Name/label for this environment (e.g. 'production')
 * @param {string} passphrase - Passphrase used for encryption
 * @param {string} [vaultDir] - Directory to store vault files
 * @returns {Promise<string>} Path to the saved vault file
 */
async function saveToVault(envContent, envName, passphrase, vaultDir = DEFAULT_VAULT_DIR) {
  if (!envContent || !envName || !passphrase) {
    throw new Error('envContent, envName, and passphrase are required');
  }

  const parsed = parseEnv(envContent);
  if (Object.keys(parsed).length === 0) {
    throw new Error('No valid key-value pairs found in env content');
  }

  const encrypted = await encryptEnv(envContent, passphrase);
  const payload = JSON.stringify({ name: envName, createdAt: new Date().toISOString(), data: encrypted });

  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }

  const filePath = path.join(vaultDir, `${envName}${VAULT_EXTENSION}`);
  fs.writeFileSync(filePath, payload, 'utf8');

  return filePath;
}

/**
 * Loads and decrypts a vault file.
 * @param {string} envName - Name/label of the environment to load
 * @param {string} passphrase - Passphrase used for decryption
 * @param {string} [vaultDir] - Directory where vault files are stored
 * @returns {Promise<Record<string, string>>} Parsed key-value pairs
 */
async function loadFromVault(envName, passphrase, vaultDir = DEFAULT_VAULT_DIR) {
  if (!envName || !passphrase) {
    throw new Error('envName and passphrase are required');
  }

  const filePath = path.join(vaultDir, `${envName}${VAULT_EXTENSION}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Vault file not found for environment: ${envName}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const payload = JSON.parse(raw);
  const decrypted = await decryptEnv(payload.data, passphrase);

  return parseEnv(decrypted);
}

/**
 * Lists all saved vault environments.
 * @param {string} [vaultDir] - Directory where vault files are stored
 * @returns {string[]} Array of environment names
 */
function listVaults(vaultDir = DEFAULT_VAULT_DIR) {
  if (!fs.existsSync(vaultDir)) return [];
  return fs
    .readdirSync(vaultDir)
    .filter((f) => f.endsWith(VAULT_EXTENSION))
    .map((f) => path.basename(f, VAULT_EXTENSION));
}

module.exports = { saveToVault, loadFromVault, listVaults };
