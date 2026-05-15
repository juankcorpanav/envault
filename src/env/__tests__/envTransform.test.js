const {
  applyTransform,
  transformValue,
  transformEnv,
  listTransforms,
  registerTransform,
  parseTransformSpec,
} = require('../envTransform');

describe('parseTransformSpec', () => {
  it('returns name only when no colon', () => {
    expect(parseTransformSpec('trim')).toEqual({ name: 'trim', arg: undefined });
  });
  it('splits name and arg at first colon', () => {
    expect(parseTransformSpec('prefix:APP_')).toEqual({ name: 'prefix', arg: 'APP_' });
  });
  it('preserves colons in arg', () => {
    expect(parseTransformSpec('replace:foo:bar')).toEqual({ name: 'replace', arg: 'foo:bar' });
  });
});

describe('applyTransform', () => {
  it('uppercase', () => expect(applyTransform('hello', 'uppercase')).toBe('HELLO'));
  it('lowercase', () => expect(applyTransform('HELLO', 'lowercase')).toBe('hello'));
  it('trim', () => expect(applyTransform('  hi  ', 'trim')).toBe('hi'));
  it('base64encode / base64decode roundtrip', () => {
    const enc = applyTransform('secret', 'base64encode');
    expect(applyTransform(enc, 'base64decode')).toBe('secret');
  });
  it('mask replaces with asterisks', () => {
    expect(applyTransform('password123', 'mask')).toMatch(/^\*+$/);
  });
  it('truncate with arg', () => {
    expect(applyTransform('abcdefgh', 'truncate:4')).toBe('abcd');
  });
  it('prefix', () => expect(applyTransform('KEY', 'prefix:MY_')).toBe('MY_KEY'));
  it('suffix', () => expect(applyTransform('value', 'suffix:_v2')).toBe('value_v2'));
  it('replace', () => expect(applyTransform('foo-bar', 'replace:foo:baz')).toBe('baz-bar'));
  it('throws on unknown transform', () => {
    expect(() => applyTransform('x', 'nonexistent')).toThrow('Unknown transform');
  });
});

describe('transformValue', () => {
  it('chains multiple transforms', () => {
    expect(transformValue('  hello  ', ['trim', 'uppercase'])).toBe('HELLO');
  });
});

describe('transformEnv', () => {
  const parsed = { DB_URL: '  postgres://localhost  ', SECRET: 'abc123', PORT: '3000' };

  it('applies rules to matching keys', () => {
    const result = transformEnv(parsed, { DB_URL: 'trim', SECRET: 'mask' });
    expect(result.DB_URL).toBe('postgres://localhost');
    expect(result.SECRET).toMatch(/^\*+$/);
    expect(result.PORT).toBe('3000');
  });

  it('skips keys not in parsed', () => {
    const result = transformEnv(parsed, { MISSING: 'uppercase' });
    expect(result).not.toHaveProperty('MISSING');
  });

  it('accepts array of specs', () => {
    const result = transformEnv(parsed, { DB_URL: ['trim', 'uppercase'] });
    expect(result.DB_URL).toBe('POSTGRES://LOCALHOST');
  });
});

describe('listTransforms', () => {
  it('returns array of built-in names', () => {
    const names = listTransforms();
    expect(names).toContain('uppercase');
    expect(names).toContain('mask');
  });
});

describe('registerTransform', () => {
  it('adds a custom transform', () => {
    registerTransform('double', (v) => v + v);
    expect(applyTransform('ab', 'double')).toBe('abab');
  });
  it('throws if fn is not a function', () => {
    expect(() => registerTransform('bad', 'not-a-fn')).toThrow();
  });
});
