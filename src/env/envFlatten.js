/**
 * envFlatten.js
 * Flatten nested JSON/object structures into dot-notation env keys,
 * and expand dot-notation env keys back into nested objects.
 */

/**
 * Flatten a nested object into dot-notation key-value pairs.
 * @param {object} obj - The object to flatten.
 * @param {string} [prefix=''] - Key prefix for recursion.
 * @returns {Record<string, string>} Flattened env map.
 */
function flattenObject(obj, prefix = '') {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new TypeError('flattenObject requires a plain object');
  }
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}`.toUpperCase() : key.toUpperCase();
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = Array.isArray(value) ? JSON.stringify(value) : String(value);
    }
  }
  return result;
}

/**
 * Expand dot-notation (underscore-delimited) env keys into a nested object.
 * @param {Record<string, string>} env - Flat env map.
 * @param {number} [depth=2] - Maximum nesting depth to expand.
 * @returns {object} Nested object.
 */
function expandEnv(env, depth = 2) {
  if (typeof env !== 'object' || env === null) {
    throw new TypeError('expandEnv requires a plain object');
  }
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    const parts = key.split('_');
    if (parts.length <= depth) {
      let cursor = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (typeof cursor[part] !== 'object' || cursor[part] === null) {
          cursor[part] = {};
        }
        cursor = cursor[part];
      }
      cursor[parts[parts.length - 1]] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * List all keys that would be produced by flattening the given object.
 * @param {object} obj
 * @returns {string[]}
 */
function listFlattenedKeys(obj) {
  return Object.keys(flattenObject(obj));
}

module.exports = { flattenObject, expandEnv, listFlattenedKeys };
