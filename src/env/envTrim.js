/**
 * envTrim.js
 * Utilities for trimming whitespace and cleaning up env values.
 */

/**
 * Trim leading/trailing whitespace from a single value.
 * Optionally collapse internal whitespace.
 * @param {string} value
 * @param {object} options
 * @param {boolean} [options.collapseInternal=false]
 * @returns {string}
 */
function trimValue(value, { collapseInternal = false } = {}) {
  if (typeof value !== 'string') return value;
  let result = value.trim();
  if (collapseInternal) {
    result = result.replace(/\s+/g, ' ');
  }
  return result;
}

/**
 * Trim all values in an env object.
 * @param {Record<string, string>} env
 * @param {object} options
 * @param {boolean} [options.collapseInternal=false]
 * @param {string[]} [options.skipKeys=[]] - Keys to leave untouched.
 * @returns {{ env: Record<string, string>, trimmed: string[] }}
 */
function trimEnv(env, { collapseInternal = false, skipKeys = [] } = {}) {
  const result = {};
  const trimmed = [];

  for (const [key, value] of Object.entries(env)) {
    if (skipKeys.includes(key)) {
      result[key] = value;
      continue;
    }
    const newValue = trimValue(value, { collapseInternal });
    result[key] = newValue;
    if (newValue !== value) {
      trimmed.push(key);
    }
  }

  return { env: result, trimmed };
}

/**
 * Format a human-readable trim report.
 * @param {string[]} trimmed - Keys whose values were changed.
 * @returns {string}
 */
function formatTrimReport(trimmed) {
  if (trimmed.length === 0) {
    return 'No values required trimming.';
  }
  const lines = trimmed.map(k => `  - ${k}`);
  return `Trimmed ${trimmed.length} value(s):\n${lines.join('\n')}`;
}

/**
 * List keys that have leading or trailing whitespace.
 * @param {Record<string, string>} env
 * @returns {string[]}
 */
function listUntrimmedKeys(env) {
  return Object.entries(env)
    .filter(([, v]) => typeof v === 'string' && v !== v.trim())
    .map(([k]) => k);
}

module.exports = { trimValue, trimEnv, formatTrimReport, listUntrimmedKeys };
