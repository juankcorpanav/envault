const {
  shouldRedact,
  redactEnv,
  listRedactedKeys,
  DEFAULT_PATTERNS,
  REDACTED_PLACEHOLDER,
} = require('../envRedact');

describe('shouldRedact', () => {
  it('returns true for keys matching default patterns', () => {
    expect(shouldRedact('DB_PASSWORD')).toBe(true);
    expect(shouldRedact('API_SECRET')).toBe(true);
    expect(shouldRedact('AUTH_TOKEN')).toBe(true);
    expect(shouldRedact('PRIVATE_KEY')).toBe(true);
    expect(shouldRedact('AWS_API_KEY')).toBe(true);
  });

  it('returns false for non-sensitive keys', () => {
    expect(shouldRedact('APP_ENV')).toBe(false);
    expect(shouldRedact('PORT')).toBe(false);
    expect(shouldRedact('DATABASE_HOST')).toBe(false);
    expect(shouldRedact('LOG_LEVEL')).toBe(false);
  });

  it('uses custom patterns when provided', () => {
    expect(shouldRedact('CUSTOM_FIELD', [/custom/i])).toBe(true);
    expect(shouldRedact('DB_PASSWORD', [/custom/i])).toBe(false);
  });
});

describe('redactEnv', () => {
  const env = {
    APP_ENV: 'production',
    DB_PASSWORD: 'supersecret',
    API_KEY: '12345',
    PORT: '3000',
    AUTH_TOKEN: 'tok_abc',
  };

  it('redacts sensitive keys with default placeholder', () => {
    const result = redactEnv(env);
    expect(result.APP_ENV).toBe('production');
    expect(result.PORT).toBe('3000');
    expect(result.DB_PASSWORD).toBe(REDACTED_PLACEHOLDER);
    expect(result.API_KEY).toBe(REDACTED_PLACEHOLDER);
    expect(result.AUTH_TOKEN).toBe(REDACTED_PLACEHOLDER);
  });

  it('uses a custom placeholder', () => {
    const result = redactEnv(env, { placeholder: '***' });
    expect(result.DB_PASSWORD).toBe('***');
  });

  it('redacts additional keys specified by caller', () => {
    const result = redactEnv(env, { additionalKeys: ['PORT'] });
    expect(result.PORT).toBe(REDACTED_PLACEHOLDER);
    expect(result.APP_ENV).toBe('production');
  });

  it('does not mutate the original env object', () => {
    redactEnv(env);
    expect(env.DB_PASSWORD).toBe('supersecret');
  });

  it('returns empty object for empty input', () => {
    expect(redactEnv({})).toEqual({});
  });
});

describe('listRedactedKeys', () => {
  const env = {
    APP_ENV: 'production',
    DB_PASSWORD: 'supersecret',
    API_KEY: '12345',
    PORT: '3000',
  };

  it('returns only sensitive keys', () => {
    const keys = listRedactedKeys(env);
    expect(keys).toContain('DB_PASSWORD');
    expect(keys).toContain('API_KEY');
    expect(keys).not.toContain('APP_ENV');
    expect(keys).not.toContain('PORT');
  });

  it('includes additional keys', () => {
    const keys = listRedactedKeys(env, { additionalKeys: ['PORT'] });
    expect(keys).toContain('PORT');
  });

  it('returns empty array when no sensitive keys exist', () => {
    expect(listRedactedKeys({ FOO: 'bar', BAZ: 'qux' })).toEqual([]);
  });
});
