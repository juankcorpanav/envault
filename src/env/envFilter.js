const { parseEnv, serializeEnv } = require('../secrets/envParser');
const fs = require('fs');

/**
 * Filter env entries by a predicate function.
 * @param {Object} env - Parsed env object
 * @param {Function} predicate - (key, value) => boolean
 * @returns {Object} Filtered env object
 */
function filterEnv(env, predicate) {
  return Object.fromEntries(
    Object.entries(env).filter(([key, value]) => predicate(key, value))
  );
}

/**
 * Filter env entries by key pattern (glob-style prefix/suffix or regex string).
 * @param {Object} env
 * @param {string|RegExp} pattern
 * @returns {Object}
 */
function filterByPattern(env, pattern) {
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  return filterEnv(env, (key) => regex.test(key));
}

/**
 * Filter env entries by value type (string heuristic).
 * @param {Object} env
 * @param {'boolean'|'number'|'string'|'url'|'empty'} type
 * @returns {Object}
 */
function filterByType(env, type) {
  return filterEnv(env, (_key, value) => {
    switch (type) {
      case 'boolean':
        return value === 'true' || value === 'false';
      case 'number':
        return value !== '' && !isNaN(Number(value));
      case 'url':
        try { new URL(value); return true; } catch { return false; }
      case 'empty':
        return value === '';
      case 'string':
        return value !== '' && isNaN(Number(value)) && value !== 'true' && value !== 'false';
      default:
        throw new Error(`Unknown type filter: ${type}`);
    }
  });
}

/**
 * Filter env entries by a list of allowed keys.
 * @param {Object} env
 * @param {string[]} keys
 * @returns {Object}
 */
function filterByKeys(env, keys) {
  const keySet = new Set(keys);
  return filterEnv(env, (key) => keySet.has(key));
}

/**
 * Filter and write result to a file.
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {Function} predicate
 */
function filterEnvFile(inputPath, outputPath, predicate) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const env = parseEnv(raw);
  const filtered = filterEnv(env, predicate);
  fs.writeFileSync(outputPath, serializeEnv(filtered), 'utf8');
  return filtered;
}

module.exports = { filterEnv, filterByPattern, filterByType, filterByKeys, filterEnvFile };
