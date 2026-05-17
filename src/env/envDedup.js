/**
 * envDedup.js
 * Detects and removes duplicate values across env keys,
 * and identifies keys sharing identical values.
 */

/**
 * Find groups of keys that share the same value.
 * @param {Object} env - Parsed env object
 * @returns {Array<{value: string, keys: string[]}>} Groups with duplicate values
 */
function findDuplicateValues(env) {
  const valueMap = {};
  for (const [key, value] of Object.entries(env)) {
    if (!valueMap[value]) valueMap[value] = [];
    valueMap[value].push(key);
  }
  return Object.entries(valueMap)
    .filter(([, keys]) => keys.length > 1)
    .map(([value, keys]) => ({ value, keys }));
}

/**
 * Deduplicate env by keeping only the first occurrence of each value.
 * @param {Object} env - Parsed env object
 * @param {Object} [options]
 * @param {boolean} [options.keepFirst=true] - Keep first key when deduping
 * @returns {{ result: Object, removed: string[] }}
 */
function dedupEnv(env, options = {}) {
  const { keepFirst = true } = options;
  const seen = new Set();
  const result = {};
  const removed = [];

  const entries = Object.entries(env);
  if (!keepFirst) entries.reverse();

  for (const [key, value] of entries) {
    if (!seen.has(value)) {
      seen.add(value);
      result[key] = value;
    } else {
      removed.push(key);
    }
  }

  if (!keepFirst) {
    // Restore original key order for kept keys
    const orderedResult = {};
    for (const [key] of Object.entries(env)) {
      if (result[key] !== undefined) orderedResult[key] = result[key];
    }
    return { result: orderedResult, removed };
  }

  return { result, removed };
}

/**
 * Format a human-readable dedup report.
 * @param {Array<{value: string, keys: string[]}>} duplicates
 * @param {string[]} removed
 * @returns {string}
 */
function formatDedupReport(duplicates, removed) {
  if (duplicates.length === 0) return 'No duplicate values found.';
  const lines = ['Duplicate value groups:'];
  for (const { value, keys } of duplicates) {
    const display = value.length > 40 ? value.slice(0, 37) + '...' : value;
    lines.push(`  value="${display}" shared by: ${keys.join(', ')}`);
  }
  if (removed.length > 0) {
    lines.push(`Removed keys: ${removed.join(', ')}`);
  }
  return lines.join('\n');
}

module.exports = { findDuplicateValues, dedupEnv, formatDedupReport };
