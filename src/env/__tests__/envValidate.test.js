const { validateField, validateEnvSchema, listRules } = require('../envValidate');

describe('validateField', () => {
  it('passes nonempty rule for non-blank value', () => {
    expect(validateField('KEY', 'hello', 'nonempty')).toEqual({ valid: true });
  });

  it('fails nonempty rule for blank value', () => {
    const result = validateField('KEY', '   ', 'nonempty');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/nonempty/);
  });

  it('passes number rule for numeric string', () => {
    expect(validateField('PORT', '3000', 'number')).toEqual({ valid: true });
  });

  it('fails number rule for non-numeric string', () => {
    const result = validateField('PORT', 'abc', 'number');
    expect(result.valid).toBe(false);
  });

  it('passes boolean rule for "true"', () => {
    expect(validateField('FLAG', 'true', 'boolean')).toEqual({ valid: true });
  });

  it('passes boolean rule for "0"', () => {
    expect(validateField('FLAG', '0', 'boolean')).toEqual({ valid: true });
  });

  it('fails boolean rule for arbitrary string', () => {
    expect(validateField('FLAG', 'yes', 'boolean').valid).toBe(false);
  });

  it('passes url rule for valid URL', () => {
    expect(validateField('ENDPOINT', 'https://example.com', 'url')).toEqual({ valid: true });
  });

  it('fails url rule for invalid URL', () => {
    expect(validateField('ENDPOINT', 'not-a-url', 'url').valid).toBe(false);
  });

  it('passes email rule for valid email', () => {
    expect(validateField('EMAIL', 'user@example.com', 'email')).toEqual({ valid: true });
  });

  it('fails email rule for invalid email', () => {
    expect(validateField('EMAIL', 'notanemail', 'email').valid).toBe(false);
  });

  it('passes json rule for valid JSON', () => {
    expect(validateField('CONFIG', '{"a":1}', 'json')).toEqual({ valid: true });
  });

  it('fails json rule for invalid JSON', () => {
    expect(validateField('CONFIG', '{bad}', 'json').valid).toBe(false);
  });

  it('returns error for unknown rule', () => {
    const result = validateField('KEY', 'val', 'nonexistent');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Unknown rule/);
  });
});

describe('validateEnvSchema', () => {
  const env = { PORT: '8080', EMAIL: 'admin@site.org', DEBUG: 'true' };

  it('passes when all keys satisfy their rules', () => {
    const schema = { PORT: 'number', EMAIL: 'email', DEBUG: 'boolean' };
    const result = validateEnvSchema(env, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when a required key is missing', () => {
    const schema = { MISSING_KEY: 'nonempty' };
    const result = validateEnvSchema(env, schema);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required but missing/);
  });

  it('supports multiple rules per key as array', () => {
    const result = validateEnvSchema({ PORT: '8080' }, { PORT: ['nonempty', 'number'] });
    expect(result.valid).toBe(true);
  });

  it('collects multiple errors', () => {
    const result = validateEnvSchema({ PORT: 'abc', EMAIL: 'bad' }, { PORT: 'number', EMAIL: 'email' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

describe('listRules', () => {
  it('returns an array of rule names', () => {
    const rules = listRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules).toContain('nonempty');
    expect(rules).toContain('number');
    expect(rules).toContain('url');
  });
});
