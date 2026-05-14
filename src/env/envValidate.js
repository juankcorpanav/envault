/**
 * envValidate.js
 * Validate env variable values against type/format rules.
 */

const RULES = {
  nonempty: (v) => v.trim().length > 0,
  number: (v) => !isNaN(Number(v)) && v.trim() !== '',
  boolean: (v) => ['true', 'false', '1', '0'].includes(v.trim().toLowerCase()),
  url: (v) => {
    try { new URL(v); return true; } catch { return false; }
  },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  alphanumeric: (v) => /^[a-zA-Z0-9_]+$/.test(v.trim()),
  json: (v) => {
    try { JSON.parse(v); return true; } catch { return false; }
  },
};

/**
 * Validate a single key/value pair against a rule name.
 * @param {string} key
 * @param {string} value
 * @param {string} rule
 * @returns {{ valid: boolean, error?: string }}
 */
function validateField(key, value, rule) {
  if (!RULES[rule]) {
    return { valid: false, error: `Unknown rule "${rule}" for key "${key}"` };
  }
  const valid = RULES[rule](value);
  return valid
    ? { valid: true }
    : { valid: false, error: `Key "${key}" failed rule "${rule}" (value: "${value}")` };
}

/**
 * Validate a parsed env object against a schema.
 * Schema: { KEY: 'rule' | string[] }
 * @param {Record<string, string>} env
 * @param {Record<string, string | string[]>} schema
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEnvSchema(env, schema) {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const ruleList = Array.isArray(rules) ? rules : [rules];
    const value = env[key];

    if (value === undefined || value === null) {
      errors.push(`Key "${key}" is required but missing from env`);
      continue;
    }

    for (const rule of ruleList) {
      const result = validateField(key, value, rule);
      if (!result.valid) errors.push(result.error);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * List all supported rule names.
 * @returns {string[]}
 */
function listRules() {
  return Object.keys(RULES);
}

module.exports = { validateField, validateEnvSchema, listRules };
