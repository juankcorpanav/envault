/**
 * envFormat.js
 * Provides formatting utilities for .env file output:
 * sorting, grouping by prefix, and alignment of values.
 */

const SUPPORTED_FORMATS = ['sorted', 'grouped', 'aligned', 'compact'];

/**
 * List all supported format styles.
 */
function listFormats() {
  return [...SUPPORTED_FORMATS];
}

/**
 * Sort env entries alphabetically by key.
 * @param {Object} env
 * @returns {Object}
 */
function sortedFormat(env) {
  return Object.fromEntries(
    Object.entries(env).sort(([a], [b]) => a.localeCompare(b))
  );
}

/**
 * Group env entries by key prefix (e.g. DB_, AWS_, APP_).
 * Returns an object where each key is a prefix and value is the sub-env.
 * @param {Object} env
 * @returns {Object}
 */
function groupedFormat(env) {
  const groups = {};
  for (const [key, value] of Object.entries(env)) {
    const underscoreIdx = key.indexOf('_');
    const prefix = underscoreIdx > 0 ? key.slice(0, underscoreIdx) : '__UNGROUPED__';
    if (!groups[prefix]) groups[prefix] = {};
    groups[prefix][key] = value;
  }
  return groups;
}

/**
 * Produce an aligned .env string where values are padded to a consistent column.
 * @param {Object} env
 * @returns {string}
 */
function alignedFormat(env) {
  const entries = Object.entries(env);
  if (entries.length === 0) return '';
  const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
  return entries
    .map(([k, v]) => `${k.padEnd(maxKeyLen)} = ${v}`)
    .join('\n');
}

/**
 * Produce a compact single-line-per-entry .env string (standard format).
 * @param {Object} env
 * @returns {string}
 */
function compactFormat(env) {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

/**
 * Apply a named format to an env object.
 * @param {Object} env
 * @param {string} format
 * @returns {Object|string}
 */
function formatEnv(env, format) {
  if (!SUPPORTED_FORMATS.includes(format)) {
    throw new Error(`Unknown format "${format}". Supported: ${SUPPORTED_FORMATS.join(', ')}`);
  }
  switch (format) {
    case 'sorted':  return sortedFormat(env);
    case 'grouped': return groupedFormat(env);
    case 'aligned': return alignedFormat(env);
    case 'compact': return compactFormat(env);
  }
}

module.exports = { listFormats, sortedFormat, groupedFormat, alignedFormat, compactFormat, formatEnv };
