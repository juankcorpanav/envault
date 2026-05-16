/**
 * envTokenize.js
 * Tokenizes env values into typed segments (plain, secret, reference, expression).
 */

const TOKEN_TYPES = ['plain', 'secret', 'reference', 'expression'];

/**
 * Tokenize a single env value into typed segments.
 * - ${VAR} => reference
 * - ${{expr}} => expression
 * - ***  => secret (masked)
 * - else => plain
 */
function tokenizeValue(value) {
  if (typeof value !== 'string') return [{ type: 'plain', raw: String(value) }];

  const tokens = [];
  const pattern = /(\$\{\{[^}]+\}\}|\$\{[^}]+\}|\*{3,})/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'plain', raw: value.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('${{')) {
      tokens.push({ type: 'expression', raw, inner: raw.slice(3, -2).trim() });
    } else if (raw.startsWith('${')) {
      tokens.push({ type: 'reference', raw, inner: raw.slice(2, -1).trim() });
    } else {
      tokens.push({ type: 'secret', raw });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < value.length) {
    tokens.push({ type: 'plain', raw: value.slice(lastIndex) });
  }

  return tokens.length ? tokens : [{ type: 'plain', raw: value }];
}

/**
 * Tokenize all entries in a parsed env object.
 * Returns a map of key => token array.
 */
function tokenizeEnv(parsed) {
  const result = {};
  for (const [key, value] of Object.entries(parsed)) {
    result[key] = tokenizeValue(value);
  }
  return result;
}

/**
 * List all unique token types present in a tokenized env map.
 */
function listTokenTypes(tokenized) {
  const types = new Set();
  for (const tokens of Object.values(tokenized)) {
    for (const token of tokens) {
      types.add(token.type);
    }
  }
  return [...types].sort();
}

/**
 * Filter tokenized env to only keys containing a specific token type.
 */
function filterByTokenType(tokenized, type) {
  if (!TOKEN_TYPES.includes(type)) {
    throw new Error(`Unknown token type: ${type}. Valid: ${TOKEN_TYPES.join(', ')}`);
  }
  const result = {};
  for (const [key, tokens] of Object.entries(tokenized)) {
    if (tokens.some(t => t.type === type)) {
      result[key] = tokens;
    }
  }
  return result;
}

module.exports = { tokenizeValue, tokenizeEnv, listTokenTypes, filterByTokenType, TOKEN_TYPES };
