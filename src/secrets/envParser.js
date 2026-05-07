/**
 * Parses a .env file string into a key-value object.
 * Ignores comments and blank lines.
 * @param {string} content - Raw .env file content
 * @returns {Object} Parsed key-value pairs
 */
function parseEnv(content) {
  const result = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serializes a key-value object back into .env file format.
 * @param {Object} envVars - Key-value pairs
 * @returns {string} .env formatted string
 */
function serializeEnv(envVars) {
  return Object.entries(envVars)
    .map(([key, value]) => {
      const needsQuotes = /\s|#|"/.test(value);
      const serializedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
      return `${key}=${serializedValue}`;
    })
    .join('\n');
}

module.exports = { parseEnv, serializeEnv };
