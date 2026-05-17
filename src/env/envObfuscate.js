const crypto = require('crypto');

const OBFUSCATE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
];

/**
 * Determines if a key should be obfuscated based on known sensitive patterns.
 * @param {string} key
 * @returns {boolean}
 */
function isObfuscatableKey(key) {
  return OBFUSCATE_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Obfuscates a value using a deterministic hash prefix + masked body.
 * @param {string} value
 * @returns {string}
 */
function obfuscateValue(value) {
  if (!value || value.length === 0) return value;
  const hash = crypto.createHash('sha256').update(value).digest('hex').slice(0, 6);
  const visible = value.slice(0, 2);
  const masked = '*'.repeat(Math.max(4, value.length - 2));
  return `${visible}${masked}[${hash}]`;
}

/**
 * Obfuscates all sensitive keys in an env object.
 * @param {Record<string, string>} env
 * @param {string[]} [extraKeys] - Additional keys to obfuscate
 * @returns {Record<string, string>}
 */
function obfuscateEnv(env, extraKeys = []) {
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    const shouldObfuscate = isObfuscatableKey(key) || extraKeys.includes(key);
    result[key] = shouldObfuscate ? obfuscateValue(value) : value;
  }
  return result;
}

/**
 * Lists all keys that would be obfuscated in the given env.
 * @param {Record<string, string>} env
 * @param {string[]} [extraKeys]
 * @returns {string[]}
 */
function listObfuscatedKeys(env, extraKeys = []) {
  return Object.keys(env).filter(
    (key) => isObfuscatableKey(key) || extraKeys.includes(key)
  );
}

/**
 * Formats a human-readable obfuscation report.
 * @param {Record<string, string>} original
 * @param {string[]} [extraKeys]
 * @returns {string}
 */
function formatObfuscateReport(original, extraKeys = []) {
  const keys = listObfuscatedKeys(original, extraKeys);
  if (keys.length === 0) return 'No keys obfuscated.';
  const lines = keys.map((k) => `  [obfuscated] ${k}`);
  return `Obfuscated ${keys.length} key(s):\n${lines.join('\n')}`;
}

module.exports = {
  isObfuscatableKey,
  obfuscateValue,
  obfuscateEnv,
  listObfuscatedKeys,
  formatObfuscateReport,
};
