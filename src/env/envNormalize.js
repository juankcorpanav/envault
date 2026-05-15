/**
 * envNormalize.js
 * Normalize environment variable keys and values
 * (trim whitespace, fix casing, strip quotes, etc.)
 */

const QUOTE_RE = /^(['"`])(.*)\1$/s;

/**
 * Normalize a single key: trim, uppercase.
 * @param {string} key
 * @returns {string}
 */
function normalizeKey(key) {
  if (typeof key !== 'string') throw new TypeError('Key must be a string');
  return key.trim().toUpperCase();
}

/**
 * Normalize a single value: trim outer whitespace, strip matching surrounding quotes.
 * @param {string} value
 * @returns {string}
 */
function normalizeValue(value) {
  if (typeof value !== 'string') throw new TypeError('Value must be a string');
  const trimmed = value.trim();
  const match = QUOTE_RE.exec(trimmed);
  return match ? match[2] : trimmed;
}

/**
 * Normalize an entire env object.
 * Duplicate keys (after normalization) — last write wins.
 * @param {Record<string, string>} env
 * @returns {{ normalized: Record<string, string>, changes: Array<{key: string, field: string, before: string, after: string}> }}
 */
function normalizeEnv(env) {
  if (!env || typeof env !== 'object') throw new TypeError('env must be a plain object');

  const normalized = {};
  const changes = [];

  for (const [rawKey, rawValue] of Object.entries(env)) {
    const normKey = normalizeKey(rawKey);
    const normValue = normalizeValue(rawValue);

    if (normKey !== rawKey) {
      changes.push({ key: normKey, field: 'key', before: rawKey, after: normKey });
    }
    if (normValue !== rawValue) {
      changes.push({ key: normKey, field: 'value', before: rawValue, after: normValue });
    }

    normalized[normKey] = normValue;
  }

  return { normalized, changes };
}

/**
 * Return a human-readable summary of normalization changes.
 * @param {Array} changes
 * @returns {string}
 */
function formatNormalizeReport(changes) {
  if (!changes.length) return 'No normalization changes.';
  return changes
    .map(c => `  [${c.key}] ${c.field}: "${c.before}" → "${c.after}"`)
    .join('\n');
}

module.exports = { normalizeKey, normalizeValue, normalizeEnv, formatNormalizeReport };
