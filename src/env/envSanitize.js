/**
 * envSanitize.js
 * Provides sanitization utilities for environment variable values.
 * Strips unsafe characters, trims whitespace, and optionally masks
 * sensitive patterns (e.g., embedded secrets, control characters).
 */

const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const LEADING_TRAILING_QUOTE_RE = /^(['"`])(.*)\1$/s;
const INLINE_COMMENT_RE = /\s+#.*$/;

/**
 * Known sensitive key patterns — values for these keys will be masked
 * in sanitize reports but not altered in the actual output.
 */
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
];

/**
 * Determine whether a key is considered sensitive.
 * @param {string} key
 * @returns {boolean}
 */
function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(key));
}

/**
 * Sanitize a single environment variable value.
 * - Strips surrounding quotes (single, double, backtick)
 * - Removes inline comments (# ...) unless the value is quoted
 * - Strips ASCII control characters
 * - Trims leading/trailing whitespace
 *
 * @param {string} value - Raw value string
 * @returns {string} Sanitized value
 */
function sanitizeValue(value) {
  if (typeof value !== 'string') return value;

  let v = value;

  // Strip surrounding quotes first (preserves spaces inside quotes)
  const quoteMatch = v.match(LEADING_TRAILING_QUOTE_RE);
  if (quoteMatch) {
    v = quoteMatch[2];
  } else {
    // Only strip inline comments from unquoted values
    v = v.replace(INLINE_COMMENT_RE, '');
    v = v.trim();
  }

  // Remove control characters
  v = v.replace(CONTROL_CHAR_RE, '');

  return v;
}

/**
 * Sanitize all values in a parsed env object.
 * Returns a new object with sanitized values and a report of changes.
 *
 * @param {Record<string, string>} env - Parsed env key/value map
 * @returns {{ sanitized: Record<string, string>, report: SanitizeReport[] }}
 */
function sanitizeEnv(env) {
  const sanitized = {};
  const report = [];

  for (const [key, value] of Object.entries(env)) {
    const clean = sanitizeValue(value);
    sanitized[key] = clean;

    const changed = clean !== value;
    const sensitive = isSensitiveKey(key);

    if (changed || sensitive) {
      report.push({
        key,
        original: sensitive ? '[REDACTED]' : value,
        sanitized: sensitive ? '[REDACTED]' : clean,
        changed,
        sensitive,
      });
    }
  }

  return { sanitized, report };
}

/**
 * Format a sanitize report as a human-readable string.
 *
 * @param {SanitizeReport[]} report
 * @returns {string}
 */
function formatSanitizeReport(report) {
  if (report.length === 0) return 'No sanitization changes.';

  const lines = ['Sanitize Report:', ''];
  for (const entry of report) {
    const tag = entry.sensitive ? ' [sensitive]' : '';
    if (entry.changed) {
      lines.push(`  ${entry.key}${tag}`);
      lines.push(`    before: ${entry.original}`);
      lines.push(`    after:  ${entry.sanitized}`);
    } else {
      lines.push(`  ${entry.key}${tag} (value unchanged, flagged as sensitive)`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  isSensitiveKey,
  sanitizeValue,
  sanitizeEnv,
  formatSanitizeReport,
};
