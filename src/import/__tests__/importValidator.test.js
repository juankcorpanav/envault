const { validateKey, validateValue, validateParsedEnv } = require('../importValidator');

describe('validateKey', () => {
  it('accepts valid uppercase keys', () => {
    expect(validateKey('MY_SECRET_KEY').valid).toBe(true);
  });

  it('accepts mixed-case keys', () => {
    expect(validateKey('myKey_123').valid).toBe(true);
  });

  it('rejects empty key', () => {
    expect(validateKey('').valid).toBe(false);
  });

  it('rejects keys with spaces', () => {
    expect(validateKey('MY KEY').valid).toBe(false);
  });

  it('rejects keys starting with a digit', () => {
    expect(validateKey('1INVALID').valid).toBe(false);
  });

  it('rejects keys exceeding max length', () => {
    expect(validateKey('A'.repeat(129)).valid).toBe(false);
  });
});

describe('validateValue', () => {
  it('accepts normal string values', () => {
    expect(validateValue('some_secret_value').valid).toBe(true);
  });

  it('accepts empty string', () => {
    expect(validateValue('').valid).toBe(true);
  });

  it('rejects non-string values', () => {
    expect(validateValue(123).valid).toBe(false);
  });

  it('rejects values exceeding max length', () => {
    expect(validateValue('x'.repeat(4097)).valid).toBe(false);
  });
});

describe('validateParsedEnv', () => {
  it('validates a clean object', () => {
    const result = validateParsedEnv({ API_KEY: 'abc123', DB_URL: 'postgres://localhost' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('collects multiple errors', () => {
    const result = validateParsedEnv({ '1BADKEY': 'val', GOOD_KEY: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects non-object input', () => {
    expect(validateParsedEnv(null).valid).toBe(false);
    expect(validateParsedEnv([]).valid).toBe(false);
  });

  it('rejects objects exceeding max entries', () => {
    const large = {};
    for (let i = 0; i < 501; i++) large[`KEY_${i}`] = 'val';
    const result = validateParsedEnv(large);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Too many entries/);
  });
});
