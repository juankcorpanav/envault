const { flattenObject, expandEnv, listFlattenedKeys } = require('../envFlatten');

describe('flattenObject', () => {
  it('flattens a shallow object', () => {
    const result = flattenObject({ host: 'localhost', port: 5432 });
    expect(result).toEqual({ HOST: 'localhost', PORT: '5432' });
  });

  it('flattens a nested object with underscore-delimited keys', () => {
    const result = flattenObject({ db: { host: 'localhost', port: 5432 } });
    expect(result).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });

  it('flattens deeply nested objects', () => {
    const result = flattenObject({ a: { b: { c: 'deep' } } });
    expect(result).toEqual({ A_B_C: 'deep' });
  });

  it('serializes arrays as JSON strings', () => {
    const result = flattenObject({ items: [1, 2, 3] });
    expect(result).toEqual({ ITEMS: '[1,2,3]' });
  });

  it('throws for non-object input', () => {
    expect(() => flattenObject('not an object')).toThrow(TypeError);
    expect(() => flattenObject(null)).toThrow(TypeError);
    expect(() => flattenObject([1, 2])).toThrow(TypeError);
  });

  it('handles empty object', () => {
    expect(flattenObject({})).toEqual({});
  });
});

describe('expandEnv', () => {
  it('expands shallow keys unchanged when depth is 1', () => {
    const result = expandEnv({ HOST: 'localhost', PORT: '5432' }, 1);
    expect(result).toMatchObject({ HOST: 'localhost', PORT: '5432' });
  });

  it('expands underscore-delimited keys up to depth', () => {
    const result = expandEnv({ DB_HOST: 'localhost', DB_PORT: '5432' }, 2);
    expect(result).toMatchObject({ DB: { HOST: 'localhost', PORT: '5432' } });
  });

  it('leaves keys beyond depth as flat', () => {
    const result = expandEnv({ A_B_C: 'deep' }, 2);
    expect(result).toHaveProperty('A_B_C', 'deep');
  });

  it('throws for non-object input', () => {
    expect(() => expandEnv(null)).toThrow(TypeError);
  });

  it('handles empty env', () => {
    expect(expandEnv({})).toEqual({});
  });
});

describe('listFlattenedKeys', () => {
  it('returns all flattened key names', () => {
    const keys = listFlattenedKeys({ db: { host: 'x', port: 1 }, app: 'y' });
    expect(keys).toContain('DB_HOST');
    expect(keys).toContain('DB_PORT');
    expect(keys).toContain('APP');
  });

  it('returns empty array for empty object', () => {
    expect(listFlattenedKeys({})).toEqual([]);
  });
});
