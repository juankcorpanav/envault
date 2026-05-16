/**
 * envPlaceholder.js
 * Detects and resolves placeholder values in env entries.
 * Placeholders follow the pattern: {{KEY}} or ${KEY}
 */

const PLACEHOLDER_REGEX = /\{\{([A-Z0-9_]+)\}\}|\$\{([A-Z0-9_]+)\}/g;

/**
 * Returns all placeholder tokens found in a value string.
 * @param {string} value
 * @returns {string[]}
 */
function extractPlaceholders(value) {
  if (typeof value !== 'string') return [];
  const matches = [];
  let match;
  const regex = new RegExp(PLACEHOLDER_REGEX.source, 'g');
  while ((match = regex.exec(value)) !== null) {
    matches.push(match[1] || match[2]);
  }
  return [...new Set(matches)];
}

/**
 * Resolves placeholders in a single value using the provided env map.
 * Unresolved placeholders are left as-is unless `strict` is true.
 * @param {string} value
 * @param {Object} envMap
 * @param {Object} [options]
 * @param {boolean} [options.strict=false]
 * @returns {string}
 */
function resolvePlaceholder(value, envMap, { strict = false } = {}) {
  if (typeof value !== 'string') return value;
  return value.replace(
    new RegExp(PLACEHOLDER_REGEX.source, 'g'),
    (match, p1, p2) => {
      const key = p1 || p2;
      if (Object.prototype.hasOwnProperty.call(envMap, key)) {
        return envMap[key];
      }
      if (strict) {
        throw new Error(`Unresolved placeholder: ${key}`);
      }
      return match;
    }
  );
}

/**
 * Resolves all placeholders across an entire env object.
 * @param {Object} env
 * @param {Object} [options]
 * @param {boolean} [options.strict=false]
 * @returns {{ resolved: Object, unresolved: string[] }}
 */
function resolvePlaceholders(env, { strict = false } = {}) {
  const resolved = {};
  const unresolved = new Set();

  for (const [key, value] of Object.entries(env)) {
    const placeholders = extractPlaceholders(value);
    const missing = placeholders.filter(p => !Object.prototype.hasOwnProperty.call(env, p));
    missing.forEach(p => unresolved.add(p));

    if (strict && missing.length > 0) {
      throw new Error(`Unresolved placeholder(s) in key "${key}": ${missing.join(', ')}`);
    }

    resolved[key] = resolvePlaceholder(value, env, { strict });
  }

  return { resolved, unresolved: [...unresolved] };
}

/**
 * Lists all keys that contain unresolved placeholders.
 * @param {Object} env
 * @returns {Array<{ key: string, placeholders: string[] }>}
 */
function listUnresolvedPlaceholders(env) {
  const results = [];
  for (const [key, value] of Object.entries(env)) {
    const placeholders = extractPlaceholders(value);
    const missing = placeholders.filter(p => !Object.prototype.hasOwnProperty.call(env, p));
    if (missing.length > 0) {
      results.push({ key, placeholders: missing });
    }
  }
  return results;
}

module.exports = {
  extractPlaceholders,
  resolvePlaceholder,
  resolvePlaceholders,
  listUnresolvedPlaceholders,
};
