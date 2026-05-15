/**
 * envBackfill.js
 * Backfill missing keys in a vault from a template or another profile.
 */

const { loadProfile } = require('./envProfile');
const { readVault, updateVault } = require('../vault/vaultAccess');
const { parseTemplate } = require('../template/envTemplate');
const fs = require('fs');

/**
 * Find keys present in source but missing in target env object.
 * @param {Object} source
 * @param {Object} target
 * @returns {Object} missing key-value pairs
 */
function findMissingKeys(source, target) {
  const missing = {};
  for (const [key, value] of Object.entries(source)) {
    if (!(key in target)) {
      missing[key] = value;
    }
  }
  return missing;
}

/**
 * Backfill a vault with missing keys from a source profile.
 * @param {string} vaultPath
 * @param {string} profileName
 * @param {Object} options
 * @param {boolean} options.dryRun - preview without writing
 * @returns {{ added: Object, skipped: string[] }}
 */
async function backfillFromProfile(vaultPath, profileName, options = {}) {
  const { dryRun = false } = options;
  const profile = await loadProfile(profileName);
  const vault = await readVault(vaultPath);
  const missing = findMissingKeys(profile, vault);
  const skipped = Object.keys(vault).filter(k => k in profile);

  if (!dryRun && Object.keys(missing).length > 0) {
    await updateVault(vaultPath, missing);
  }

  return { added: missing, skipped };
}

/**
 * Backfill a vault with default values from a template file.
 * Only keys with defined defaults are backfilled.
 * @param {string} vaultPath
 * @param {string} templatePath
 * @param {Object} options
 * @param {boolean} options.dryRun
 * @returns {{ added: Object, skipped: string[] }}
 */
async function backfillFromTemplate(vaultPath, templatePath, options = {}) {
  const { dryRun = false } = options;
  const raw = fs.readFileSync(templatePath, 'utf8');
  const template = parseTemplate(raw);
  const vault = await readVault(vaultPath);

  const defaults = {};
  for (const [key, meta] of Object.entries(template)) {
    if (meta.default !== undefined) {
      defaults[key] = meta.default;
    }
  }

  const missing = findMissingKeys(defaults, vault);
  const skipped = Object.keys(vault).filter(k => k in defaults);

  if (!dryRun && Object.keys(missing).length > 0) {
    await updateVault(vaultPath, missing);
  }

  return { added: missing, skipped };
}

module.exports = { findMissingKeys, backfillFromProfile, backfillFromTemplate };
