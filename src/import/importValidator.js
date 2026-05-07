/**
 * Validates parsed env key-value pairs before import.
 */

const KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/i;
const MAX_KEY_LENGTH = 128;
const MAX_VALUE_LENGTH = 4096;
const MAX_ENTRIES = 500;

/**
 * Validates a single env key.
 * @param {string} key
 * @returns {{ valid: boolean, error?: string }}
 */
function validateKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Key must be a non-empty string' };
  }
  if (key.length > MAX_KEY_LENGTH) {
    return { valid: false, error: `Key exceeds max length of ${MAX_KEY_LENGTH}` };
  }
  if (!KEY_PATTERN.test(key)) {
    return { valid: false, error: `Key "${key}" contains invalid characters` };
  }
  return { valid: true };
}

/**
 * Validates a single env value.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateValue(value) {
  if (typeof value !== 'string') {
    return { valid: false, error: 'Value must be a string' };
  }
  if (value.length > MAX_VALUE_LENGTH) {
    return { valid: false, error: `Value exceeds max length of ${MAX_VALUE_LENGTH}` };
  }
  return { valid: true };
}

/**
 * Validates an entire parsed env object.
 * @param {Object} parsed - Key-value pairs.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateParsedEnv(parsed) {
  const errors = [];

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, errors: ['Parsed env must be a plain object'] };
  }

  const entries = Object.entries(parsed);
  if (entries.length > MAX_ENTRIES) {
    errors.push(`Too many entries: max ${MAX_ENTRIES}, got ${entries.length}`);
  }

  for (const [key, value] of entries) {
    const keyResult = validateKey(key);
    if (!keyResult.valid) errors.push(keyResult.error);

    const valueResult = validateValue(value);
    if (!valueResult.valid) errors.push(`[${key}] ${valueResult.error}`);
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateKey, validateValue, validateParsedEnv };
