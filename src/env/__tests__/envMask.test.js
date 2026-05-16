const {
  isMaskableKey,
  maskValue,
  maskEnv,
  listMaskedKeys,
  formatMaskReport,
} = require('../envMask');

describe('isMaskableKey', () => {
  it('returns true for secret keys', () => {
    expect(isMaskableKey('DB_SECRET')).toBe(true);
    expect(isMaskableKey('API_KEY')).toBe(true);
    expect(isMaskableKey('AUTH_TOKEN')).toBe(true);
    expect(isMaskableKey('PRIVATE_KEY')).toBe(true);
    expect(isMaskableKey('PASSWORD')).toBe(true);
  });

  it('returns false for non-sensitive keys', () => {
    expect(isMaskableKey('APP_NAME')).toBe(false);
    expect(isMaskableKey('PORT')).toBe(false);
    expect(isMaskableKey('NODE_ENV')).toBe(false);
  });
});

describe('maskValue', () => {
  it('returns default mask when no reveal', () => {
    expect(maskValue('supersecret')).toBe('********');
  });

  it('reveals trailing characters when reveal > 0', () => {
    const result = maskValue('supersecret', { reveal: 3 });
    expect(result).toBe('********ret');
  });

  it('does not reveal more than half the value', () => {
    const result = maskValue('ab', { reveal: 5 });
    expect(result).toBe('********b');
  });

  it('uses custom mask string', () => {
    expect(maskValue('hello', { mask: '###' })).toBe('###');
  });

  it('handles empty value', () => {
    expect(maskValue('')).toBe('********');
  });
});

describe('maskEnv', () => {
  const env = {
    APP_NAME: 'envault',
    DB_PASSWORD: 'hunter2',
    API_KEY: 'abc123xyz',
    PORT: '3000',
  };

  it('masks sensitive keys and leaves others unchanged', () => {
    const result = maskEnv(env);
    expect(result.APP_NAME).toBe('envault');
    expect(result.PORT).toBe('3000');
    expect(result.DB_PASSWORD).toBe('********');
    expect(result.API_KEY).toBe('********');
  });

  it('masks extra keys provided in options', () => {
    const result = maskEnv(env, { keys: ['APP_NAME'] });
    expect(result.APP_NAME).toBe('********');
    expect(result.PORT).toBe('3000');
  });

  it('supports reveal option', () => {
    const result = maskEnv(env, { reveal: 3 });
    expect(result.DB_PASSWORD).toBe('********er2');
  });

  it('does not mutate original env', () => {
    maskEnv(env);
    expect(env.DB_PASSWORD).toBe('hunter2');
  });
});

describe('listMaskedKeys', () => {
  it('returns only sensitive keys', () => {
    const env = { APP_NAME: 'x', DB_SECRET: 'y', PORT: '80' };
    expect(listMaskedKeys(env)).toEqual(['DB_SECRET']);
  });

  it('includes extra keys', () => {
    const env = { APP_NAME: 'x', PORT: '80' };
    expect(listMaskedKeys(env, ['APP_NAME'])).toEqual(['APP_NAME']);
  });
});

describe('formatMaskReport', () => {
  it('annotates masked entries', () => {
    const original = { APP_NAME: 'envault', API_KEY: 'secret123' };
    const masked = { APP_NAME: 'envault', API_KEY: '********' };
    const report = formatMaskReport(original, masked);
    expect(report).toContain('API_KEY=********  [masked]');
    expect(report).not.toContain('APP_NAME=envault  [masked]');
    expect(report).toContain('APP_NAME=envault');
  });
});
