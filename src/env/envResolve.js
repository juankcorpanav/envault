/**
 * envResolve.js
 * Resolves env variable references and interpolations within a parsed env object.
 * Supports ${VAR} syntax and optional fallback values like ${VAR:-default}.
 */

/**
 * Resolve a single value string against a context map.
 * @param {string} value
 * @param {Record<string, string>} context
 * @returns {string}
 */
function resolveValue(value, context) {
  return value.replace(/\$\{([^}]+)\}/g, (match, expr) => {
    const separatorIndex = expr.indexOf(':-');
    if (separatorIndex !== -1) {
      const key = expr.slice(0, separatorIndex).trim();
      const fallback = expr.slice(separatorIndex + 2);
      return Object.prototype.hasOwnProperty.call(context, key)
        ? context[key]
        : fallback;
    }
    const key = expr.trim();
    if (Object.prototype.hasOwnProperty.call(context, key)) {
      return context[key];
    }
    return match; // leave unresolved references as-is
  });
}

/**
 * Resolve all values in a parsed env object.
 * References are resolved in declaration order; forward references remain unresolved.
 * @param {Record<string, string>} parsed
 * @returns {Record<string, string>}
 */
function resolveEnv(parsed) {
  const resolved = {};
  for (const [key, value] of Object.entries(parsed)) {
    resolved[key] = resolveValue(value, resolved);
  }
  return resolved;
}

/**
 * List all unresolved variable references remaining after resolution.
 * @param {Record<string, string>} resolved
 * @returns {string[]}
 */
function listUnresolved(resolved) {
  const unresolved = new Set();
  for (const value of Object.values(resolved)) {
    const matches = value.matchAll(/\$\{([^}:]+)(?::-.*)? \}/g);
    for (const m of value.matchAll(/\$\{([^}]+)\}/g)) {
      const expr = m[1];
      const key = expr.includes(':-') ? expr.slice(0, expr.indexOf(':-')).trim() : expr.trim();
      if (!Object.prototype.hasOwnProperty.call(resolved, key)) {
        unresolved.add(key);
      }
    }
  }
  return Array.from(unresolved);
}

module.exports = { resolveValue, resolveEnv, listUnresolved };
