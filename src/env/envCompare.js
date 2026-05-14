/**
 * envCompare.js
 * Compare two env profiles or vaults and report differences.
 */

const { loadProfile } = require('./envProfile');
const { readVault } = require('../vault/vaultAccess');
const { diffEnv, formatDiff } = require('../diff/envDiff');

/**
 * Compare two named profiles.
 * @param {string} nameA
 * @param {string} nameB
 * @returns {{ diff: object, summary: string }}
 */
function compareProfiles(nameA, nameB) {
  const envA = loadProfile(nameA);
  const envB = loadProfile(nameB);
  const diff = diffEnv(envA, envB);
  const summary = formatDiff(diff);
  return { diff, summary };
}

/**
 * Compare two vaults by path.
 * @param {string} pathA
 * @param {string} pathB
 * @returns {{ diff: object, summary: string }}
 */
function compareVaults(pathA, pathB) {
  const envA = readVault(pathA);
  const envB = readVault(pathB);
  const diff = diffEnv(envA, envB);
  const summary = formatDiff(diff);
  return { diff, summary };
}

/**
 * Compare a profile against a vault.
 * @param {string} profileName
 * @param {string} vaultPath
 * @returns {{ diff: object, summary: string }}
 */
function compareProfileToVault(profileName, vaultPath) {
  const envA = loadProfile(profileName);
  const envB = readVault(vaultPath);
  const diff = diffEnv(envA, envB);
  const summary = formatDiff(diff);
  return { diff, summary };
}

/**
 * Return only keys that differ between two env maps.
 * @param {object} envA
 * @param {object} envB
 * @returns {string[]}
 */
function changedKeys(envA, envB) {
  const diff = diffEnv(envA, envB);
  return [
    ...Object.keys(diff.added || {}),
    ...Object.keys(diff.removed || {}),
    ...Object.keys(diff.changed || {})
  ];
}

module.exports = { compareProfiles, compareVaults, compareProfileToVault, changedKeys };
