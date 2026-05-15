const {
  normalizeKey,
  normalizeValue,
  normalizeEnv,
  formatNormalizeReport,
} = require('../envNormalize');

describe('normalizeKey', () => {
  it('trims whitespace', () => {
    expect(normalizeKey('  my_key  ')).toBe('MY_KEY');
  });

  it('uppercases the key', () => {
    expect(normalizeKey('db_host')).toBe('DB_HOST');
  });

  it('throws on non-string input', () => {
    expect(() => normalizeKey(42)).toThrow(TypeError);
  });
});

describe('normalizeValue', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeValue('  hello  ')).toBe('hello');
  });

  it('strips matching double quotes', () => {
    expect(normalizeValue('"my value"')).toBe('my value');
  });

  it('strips matching single quotes', () => {
    expect(normalizeValue("'my value'")).toBe('my value');
  });

  it('strips matching backticks', () => {
    expect(normalizeValue('`my value`')).toBe('my value');
  });

  it('does not strip mismatched quotes', () => {
    expect(normalizeValue('"unmatched\'')).toBe('"unmatched\'');
  });

  it('throws on non-string input', () => {
    expect(() => normalizeValue(null)).toThrow(TypeError);
  });
});

describe('normalizeEnv', () => {
  it('normalizes keys and values', () => {
    const { normalized, changes } = normalizeEnv({
      '  db_host  ': '"localhost"',
      api_key: '  secret  ',
    });
    expect(normalized).toEqual({ DB_HOST: 'localhost', API_KEY: 'secret' });
    expect(changes.length).toBeGreaterThan(0);
  });

  it('records no changes when already normalized', () => {
    const { normalized, changes } = normalizeEnv({ DB_HOST: 'localhost' });
    expect(normalized).toEqual({ DB_HOST: 'localhost' });
    expect(changes).toHaveLength(0);
  });

  it('last write wins on duplicate normalized keys', () => {
    const { normalized } = normalizeEnv({ db_host: 'first', DB_HOST: 'second' });
    expect(normalized.DB_HOST).toBe('second');
  });

  it('throws on invalid input', () => {
    expect(() => normalizeEnv(null)).toThrow(TypeError);
  });
});

describe('formatNormalizeReport', () => {
  it('returns a no-changes message for empty array', () => {
    expect(formatNormalizeReport([])).toBe('No normalization changes.');
  });

  it('formats changes correctly', () => {
    const changes = [{ key: 'DB_HOST', field: 'value', before: '"localhost"', after: 'localhost' }];
    const report = formatNormalizeReport(changes);
    expect(report).toContain('[DB_HOST]');
    expect(report).toContain('"localhost"');
    expect(report).toContain('localhost');
  });
});
