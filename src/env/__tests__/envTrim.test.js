const { trimValue, trimEnv, formatTrimReport, listUntrimmedKeys } = require('../envTrim');

describe('trimValue', () => {
  it('trims leading and trailing whitespace', () => {
    expect(trimValue('  hello  ')).toBe('hello');
  });

  it('leaves clean values unchanged', () => {
    expect(trimValue('hello')).toBe('hello');
  });

  it('collapses internal whitespace when option is set', () => {
    expect(trimValue('hello   world', { collapseInternal: true })).toBe('hello world');
  });

  it('does not collapse internal whitespace by default', () => {
    expect(trimValue('hello   world')).toBe('hello   world');
  });

  it('returns non-string values unchanged', () => {
    expect(trimValue(42)).toBe(42);
    expect(trimValue(null)).toBe(null);
  });
});

describe('trimEnv', () => {
  const env = {
    API_KEY: '  abc123  ',
    BASE_URL: 'https://example.com',
    NOTE: '  hello   world  ',
  };

  it('trims all values', () => {
    const { env: result } = trimEnv(env);
    expect(result.API_KEY).toBe('abc123');
    expect(result.BASE_URL).toBe('https://example.com');
    expect(result.NOTE).toBe('hello   world');
  });

  it('reports which keys were trimmed', () => {
    const { trimmed } = trimEnv(env);
    expect(trimmed).toContain('API_KEY');
    expect(trimmed).toContain('NOTE');
    expect(trimmed).not.toContain('BASE_URL');
  });

  it('skips keys listed in skipKeys', () => {
    const { env: result, trimmed } = trimEnv(env, { skipKeys: ['API_KEY'] });
    expect(result.API_KEY).toBe('  abc123  ');
    expect(trimmed).not.toContain('API_KEY');
  });

  it('collapses internal whitespace when option is set', () => {
    const { env: result } = trimEnv(env, { collapseInternal: true });
    expect(result.NOTE).toBe('hello world');
  });

  it('returns empty trimmed array when nothing changes', () => {
    const clean = { KEY: 'value', OTHER: 'clean' };
    const { trimmed } = trimEnv(clean);
    expect(trimmed).toHaveLength(0);
  });
});

describe('formatTrimReport', () => {
  it('reports no trimming needed', () => {
    expect(formatTrimReport([])).toBe('No values required trimming.');
  });

  it('lists trimmed keys', () => {
    const report = formatTrimReport(['API_KEY', 'SECRET']);
    expect(report).toContain('Trimmed 2 value(s)');
    expect(report).toContain('- API_KEY');
    expect(report).toContain('- SECRET');
  });
});

describe('listUntrimmedKeys', () => {
  it('returns keys with untrimmed values', () => {
    const env = { A: '  hello', B: 'clean', C: 'world  ' };
    const keys = listUntrimmedKeys(env);
    expect(keys).toContain('A');
    expect(keys).toContain('C');
    expect(keys).not.toContain('B');
  });

  it('returns empty array when all values are trimmed', () => {
    expect(listUntrimmedKeys({ X: 'ok', Y: 'fine' })).toHaveLength(0);
  });
});
