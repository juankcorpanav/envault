/**
 * envSearch.js — Search and filter env keys/values across vaults and profiles
 */

const { listVaults } = require('../vault/vaultManager');
const { readVault } = require('../vault/vaultAccess');
const { listProfiles, loadProfile } = require('./envProfile');

/**
 * Search for keys or values matching a query within a single env object.
 * @param {object} env - Parsed env key/value pairs
 * @param {string} query - Search string or regex pattern
 * @param {object} options - { searchKeys, searchValues, regex, caseSensitive }
 * @returns {object} - Matched key/value pairs
 */
function searchEnv(env, query, options = {}) {
  const {
    searchKeys = true,
    searchValues = true,
    regex = false,
    caseSensitive = false,
  } = options;

  let matcher;
  if (regex) {
    const flags = caseSensitive ? '' : 'i';
    matcher = (str) => new RegExp(query, flags).test(str);
  } else {
    const needle = caseSensitive ? query : query.toLowerCase();
    matcher = (str) => {
      const hay = caseSensitive ? str : str.toLowerCase();
      return hay.includes(needle);
    };
  }

  const results = {};
  for (const [key, value] of Object.entries(env)) {
    const keyMatch = searchKeys && matcher(key);
    const valMatch = searchValues && matcher(String(value));
    if (keyMatch || valMatch) {
      results[key] = value;
    }
  }
  return results;
}

/**
 * Search across all vaults for matching keys/values.
 * @param {string} query
 * @param {object} options
 * @returns {Array<{vault: string, matches: object}>}
 */
async function searchAcrossVaults(query, options = {}) {
  const vaults = await listVaults();
  const results = [];
  for (const vault of vaults) {
    try {
      const env = await readVault(vault);
      const matches = searchEnv(env, query, options);
      if (Object.keys(matches).length > 0) {
        results.push({ source: 'vault', name: vault, matches });
      }
    } catch {
      // skip unreadable vaults
    }
  }
  return results;
}

/**
 * Search across all profiles for matching keys/values.
 * @param {string} query
 * @param {object} options
 * @returns {Array<{profile: string, matches: object}>}
 */
async function searchAcrossProfiles(query, options = {}) {
  const profiles = await listProfiles();
  const results = [];
  for (const profile of profiles) {
    try {
      const env = await loadProfile(profile);
      const matches = searchEnv(env, query, options);
      if (Object.keys(matches).length > 0) {
        results.push({ source: 'profile', name: profile, matches });
      }
    } catch {
      // skip unreadable profiles
    }
  }
  return results;
}

module.exports = { searchEnv, searchAcrossVaults, searchAcrossProfiles };
