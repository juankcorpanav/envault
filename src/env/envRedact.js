/**
 * envRedact.js — Redact sensitive values from env objects for safe logging/display
 */

const DEFAULT_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /passphrase/i,
];

const REDACTED_PLACEHOLDER = '[REDACTED]';

/**
 * Determine if a key should be redacted based on patterns.
 * @param {string} key
 * @param {RegExp[]} patterns
 * @returns {boolean}
 */
function shouldRedact(key, patterns = DEFAULT_PATTERNS) {
  return patterns.some((pattern) => pattern.test(key));
}

/**
 * Redact sensitive keys from a parsed env object.
 * @param {Record<string, string>} env
 * @param {object} options
 * @param {RegExp[]} [options.patterns]
 * @param {string[]} [options.additionalKeys]
 * @param {string} [options.placeholder]
 * @returns {Record<string, string>}
 */
function redactEnv(env, options = {}) {
  const {
    patterns = DEFAULT_PATTERNS,
    additionalKeys = [],
    placeholder = REDACTED_PLACEHOLDER,
  } = options;

  const extraPatterns = additionalKeys.map(
    (k) => new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  );
  const allPatterns = [...patterns, ...extraPatterns];

  return Object.fromEntries(
    Object.entries(env).map(([key, value]) => [
      key,
      shouldRedact(key, allPatterns) ? placeholder : value,
    ])
  );
}

/**
 * Return only the keys that would be redacted.
 * @param {Record<string, string>} env
 * @param {object} options
 * @returns {string[]}
 */
function listRedactedKeys(env, options = {}) {
  const { patterns = DEFAULT_PATTERNS, additionalKeys = [] } = options;
  const extraPatterns = additionalKeys.map(
    (k) => new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  );
  const allPatterns = [...patterns, ...extraPatterns];
  return Object.keys(env).filter((key) => shouldRedact(key, allPatterns));
}

module.exports = { shouldRedact, redactEnv, listRedactedKeys, DEFAULT_PATTERNS, REDACTED_PLACEHOLDER };
