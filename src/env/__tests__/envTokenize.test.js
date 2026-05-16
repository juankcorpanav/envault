const {
  tokenizeValue,
  tokenizeEnv,
  listTokenTypes,
  filterByTokenType,
  TOKEN_TYPES
} = require('../envTokenize');

describe('tokenizeValue', () => {
  it('returns a plain token for a simple string', () => {
    expect(tokenizeValue('hello')).toEqual([{ type: 'plain', raw: 'hello' }]);
  });

  it('detects a reference token ${VAR}', () => {
    const tokens = tokenizeValue('${DB_HOST}');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: 'reference', inner: 'DB_HOST' });
  });

  it('detects an expression token ${{expr}}', () => {
    const tokens = tokenizeValue('${{env.NODE_ENV}}');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: 'expression', inner: 'env.NODE_ENV' });
  });

  it('detects a secret token (***)', () => {
    const tokens = tokenizeValue('***');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('secret');
  });

  it('handles mixed tokens in one value', () => {
    const tokens = tokenizeValue('prefix_${HOST}:5432');
    expect(tokens).toHaveLength(3);
    expect(tokens[0].type).toBe('plain');
    expect(tokens[1].type).toBe('reference');
    expect(tokens[2].type).toBe('plain');
  });

  it('handles non-string values by coercing to string', () => {
    const tokens = tokenizeValue(42);
    expect(tokens).toEqual([{ type: 'plain', raw: '42' }]);
  });
});

describe('tokenizeEnv', () => {
  it('tokenizes all keys in a parsed env object', () => {
    const parsed = { HOST: '${DB_HOST}', PORT: '5432', SECRET: '***' };
    const result = tokenizeEnv(parsed);
    expect(Object.keys(result)).toEqual(['HOST', 'PORT', 'SECRET']);
    expect(result.HOST[0].type).toBe('reference');
    expect(result.PORT[0].type).toBe('plain');
    expect(result.SECRET[0].type).toBe('secret');
  });
});

describe('listTokenTypes', () => {
  it('returns unique token types present', () => {
    const parsed = { A: '${X}', B: 'plain', C: '***' };
    const tokenized = tokenizeEnv(parsed);
    const types = listTokenTypes(tokenized);
    expect(types).toContain('reference');
    expect(types).toContain('plain');
    expect(types).toContain('secret');
    expect(types).not.toContain('expression');
  });

  it('returns empty array for empty tokenized map', () => {
    expect(listTokenTypes({})).toEqual([]);
  });
});

describe('filterByTokenType', () => {
  const tokenized = tokenizeEnv({
    A: '${HOST}',
    B: 'static',
    C: '***',
    D: '${{expr}}'
  });

  it('filters to only reference tokens', () => {
    const result = filterByTokenType(tokenized, 'reference');
    expect(Object.keys(result)).toEqual(['A']);
  });

  it('filters to only secret tokens', () => {
    const result = filterByTokenType(tokenized, 'secret');
    expect(Object.keys(result)).toEqual(['C']);
  });

  it('throws for unknown token type', () => {
    expect(() => filterByTokenType(tokenized, 'unknown')).toThrow('Unknown token type');
  });
});

describe('TOKEN_TYPES', () => {
  it('includes all four base types', () => {
    expect(TOKEN_TYPES).toEqual(expect.arrayContaining(['plain', 'secret', 'reference', 'expression']));
  });
});
