/**
 * envMask.js — Mask env values for display, logging, and export
 * Supports partial reveal, full mask, and custom mask patterns.
 */

const DEFAULT_MASK = '********';
const SENSITIVE_PATTERNS = [
  /secret/i,
  /password/i,
  /passwd/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /cert/i,
  /passphrase/i,
];

/**
 * Determine if a key should be masked by default.
 * @param {string} key
 * @returns {boolean}
 */
function isMaskableKey(key) {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Mask a single value, optionally revealing a trailing portion.
 * @param {string} value
 * @param {object} options
 * @param {number} [options.reveal=0] - Number of trailing chars to reveal
 * @param {string} [options.mask='********'] - Mask string
 * @returns {string}
 */
function maskValue(value, { reveal = 0, mask = DEFAULT_MASK } = {}) {
  if (!value || value.length === 0) return mask;
  if (reveal <= 0) return mask;
  const revealCount = Math.min(reveal, Math.floor(value.length / 2));
  const tail = value.slice(-revealCount);
  return `${mask}${tail}`;
}

/**
 * Mask all sensitive keys in an env object.
 * @param {object} env - Parsed env key/value map
 * @param {object} options
 * @param {string[]} [options.keys=[]] - Additional keys to mask
 * @param {number} [options.reveal=0]
 * @param {string} [options.mask]
 * @returns {object} - New env object with masked values
 */
function maskEnv(env, options = {}) {
  const { keys = [], reveal = 0, mask = DEFAULT_MASK } = options;
  const extraKeys = new Set(keys.map((k) => k.toUpperCase()));
  return Object.fromEntries(
    Object.entries(env).map(([k, v]) => {
      const shouldMask = isMaskableKey(k) || extraKeys.has(k.toUpperCase());
      return [k, shouldMask ? maskValue(v, { reveal, mask }) : v];
    })
  );
}

/**
 * List all keys that would be masked in a given env object.
 * @param {object} env
 * @param {string[]} [extraKeys=[]]
 * @returns {string[]}
 */
function listMaskedKeys(env, extraKeys = []) {
  const extra = new Set(extraKeys.map((k) => k.toUpperCase()));
  return Object.keys(env).filter(
    (k) => isMaskableKey(k) || extra.has(k.toUpperCase())
  );
}

/**
 * Format a masked env report as a string.
 * @param {object} original
 * @param {object} masked
 * @returns {string}
 */
function formatMaskReport(original, masked) {
  const lines = Object.keys(masked).map((k) => {
    const wasMasked = masked[k] !== original[k];
    return `  ${k}=${masked[k]}${wasMasked ? '  [masked]' : ''}`;
  });
  return lines.join('\n');
}

module.exports = { isMaskableKey, maskValue, maskEnv, listMaskedKeys, formatMaskReport };
