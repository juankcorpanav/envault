const {
  isObfuscatableKey,
  obfuscateValue,
  obfuscateEnv,
  listObfuscatedKeys,
  formatObfuscateReport,
} = require('../envObfuscate');

describe('isObfuscatableKey', () => {
  it('matches password keys', () => {
    expect(isObfuscatableKey('DB_PASSWORD')).toBe(true);
    expect(isObfuscatableKey('password')).toBe(true);
  });

  it('matches secret keys', () => {
    expect(isObfuscatableKey('APP_SECRET')).toBe(true);
  });

  it('matches token keys', () => {
    expect(isObfuscatableKey('ACCESS_TOKEN')).toBe(true);
  });

  it('matches api key patterns', () => {
    expect(isObfuscatableKey('API_KEY')).toBe(true);
    expect(isObfuscatableKey('APIKEY')).toBe(true);
  });

  it('does not match safe keys', () => {
    expect(isObfuscatableKey('PORT')).toBe(false);
    expect(isObfuscatableKey('NODE_ENV')).toBe(false);
    expect(isObfuscatableKey('HOST')).toBe(false);
  });
});

describe('obfuscateValue', () => {
  it('returns empty string unchanged', () => {
    expect(obfuscateValue('')).toBe('');
  });

  it('masks all but first 2 chars and appends hash', () => {
    const result = obfuscateValue('mysecret123');
    expect(result.startsWith('my')).toBe(true);
    expect(result).toMatch(/\[[a-f0-9]{6}\]$/);
    expect(result).toContain('*');
  });

  it('produces consistent output for same input', () => {
    const a = obfuscateValue('hello');
    const b = obfuscateValue('hello');
    expect(a).toBe(b);
  });

  it('produces different output for different inputs', () => {
    expect(obfuscateValue('abc')).not.toBe(obfuscateValue('xyz'));
  });
});

describe('obfuscateEnv', () => {
  const env = {
    PORT: '3000',
    DB_PASSWORD: 'supersecret',
    API_KEY: 'abc123',
    NODE_ENV: 'production',
  };

  it('obfuscates sensitive keys and leaves others unchanged', () => {
    const result = obfuscateEnv(env);
    expect(result.PORT).toBe('3000');
    expect(result.NODE_ENV).toBe('production');
    expect(result.DB_PASSWORD).not.toBe('supersecret');
    expect(result.API_KEY).not.toBe('abc123');
  });

  it('obfuscates extra keys provided by caller', () => {
    const result = obfuscateEnv(env, ['PORT']);
    expect(result.PORT).not.toBe('3000');
  });

  it('does not mutate the original env', () => {
    obfuscateEnv(env);
    expect(env.DB_PASSWORD).toBe('supersecret');
  });
});

describe('listObfuscatedKeys', () => {
  it('returns only sensitive keys', () => {
    const env = { PORT: '3000', SECRET_KEY: 'x', HOST: 'localhost' };
    expect(listObfuscatedKeys(env)).toEqual(['SECRET_KEY']);
  });

  it('includes extra keys', () => {
    const env = { PORT: '3000', HOST: 'localhost' };
    expect(listObfuscatedKeys(env, ['PORT'])).toEqual(['PORT']);
  });

  it('returns empty array when no sensitive keys', () => {
    const env = { PORT: '3000', HOST: 'localhost' };
    expect(listObfuscatedKeys(env)).toEqual([]);
  });
});

describe('formatObfuscateReport', () => {
  it('returns message when nothing to obfuscate', () => {
    expect(formatObfuscateReport({ PORT: '3000' })).toBe('No keys obfuscated.');
  });

  it('lists obfuscated keys in report', () => {
    const env = { DB_PASSWORD: 'x', PORT: '3000' };
    const report = formatObfuscateReport(env);
    expect(report).toContain('DB_PASSWORD');
    expect(report).toContain('1 key(s)');
  });
});
