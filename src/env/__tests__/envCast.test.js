const { castValue, castEnv, listCastTypes, formatCastReport } = require('../envCast');

describe('listCastTypes', () => {
  it('returns all supported types', () => {
    const types = listCastTypes();
    expect(types).toEqual(expect.arrayContaining(['string', 'boolean', 'number', 'integer', 'json', 'array']));
  });
});

describe('castValue', () => {
  it('casts to string', () => {
    expect(castValue(42, 'string')).toBe('42');
    expect(castValue('hello', 'string')).toBe('hello');
  });

  it('casts truthy booleans', () => {
    for (const v of ['true', '1', 'yes', 'on']) {
      expect(castValue(v, 'boolean')).toBe(true);
    }
  });

  it('casts falsy booleans', () => {
    for (const v of ['false', '0', 'no', 'off']) {
      expect(castValue(v, 'boolean')).toBe(false);
    }
  });

  it('throws on invalid boolean', () => {
    expect(() => castValue('maybe', 'boolean')).toThrow();
  });

  it('casts to number', () => {
    expect(castValue('3.14', 'number')).toBe(3.14);
    expect(castValue('0', 'number')).toBe(0);
  });

  it('throws on invalid number', () => {
    expect(() => castValue('abc', 'number')).toThrow();
  });

  it('casts to integer', () => {
    expect(castValue('7', 'integer')).toBe(7);
    expect(castValue('7.9', 'integer')).toBe(7);
  });

  it('throws on invalid integer', () => {
    expect(() => castValue('xyz', 'integer')).toThrow();
  });

  it('casts to json', () => {
    expect(castValue('{"a":1}', 'json')).toEqual({ a: 1 });
    expect(castValue('[1,2,3]', 'json')).toEqual([1, 2, 3]);
  });

  it('throws on invalid json', () => {
    expect(() => castValue('{bad}', 'json')).toThrow();
  });

  it('casts to array', () => {
    expect(castValue('a,b,c', 'array')).toEqual(['a', 'b', 'c']);
    expect(castValue('x', 'array')).toEqual(['x']);
    expect(castValue('', 'array')).toEqual([]);
  });

  it('throws on unknown type', () => {
    expect(() => castValue('val', 'xml')).toThrow(/Unknown cast type/);
  });

  it('throws on null value', () => {
    expect(() => castValue(null, 'string')).toThrow();
  });
});

describe('castEnv', () => {
  it('casts matching keys and passes through others', () => {
    const env = { PORT: '3000', DEBUG: 'true', NAME: 'app' };
    const schema = { PORT: 'integer', DEBUG: 'boolean' };
    const result = castEnv(env, schema);
    expect(result.PORT).toBe(3000);
    expect(result.DEBUG).toBe(true);
    expect(result.NAME).toBe('app');
  });

  it('returns empty object for empty env', () => {
    expect(castEnv({}, {})).toEqual({});
  });
});

describe('formatCastReport', () => {
  it('formats successful entries', () => {
    const report = formatCastReport([{ key: 'PORT', from: '3000', to: 3000, type: 'integer' }]);
    expect(report).toContain('[OK]');
    expect(report).toContain('PORT');
  });

  it('formats failed entries', () => {
    const report = formatCastReport([{ key: 'X', error: 'bad value' }]);
    expect(report).toContain('[FAIL]');
    expect(report).toContain('bad value');
  });
});
