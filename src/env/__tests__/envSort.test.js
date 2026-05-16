const {
  sortAlphabetical,
  sortByPrefix,
  sortByCustomOrder,
  sortEnv,
  listSortStrategies,
} = require('../envSort');

const sampleEnv = {
  DB_HOST: 'localhost',
  APP_NAME: 'envault',
  AWS_REGION: 'us-east-1',
  APP_PORT: '3000',
  DB_PORT: '5432',
  ZEBRA: 'last',
};

describe('sortAlphabetical', () => {
  it('returns keys in alphabetical order', () => {
    const result = sortAlphabetical(sampleEnv);
    const keys = Object.keys(result);
    expect(keys).toEqual([...keys].sort());
  });

  it('preserves all key-value pairs', () => {
    const result = sortAlphabetical(sampleEnv);
    expect(Object.keys(result)).toHaveLength(Object.keys(sampleEnv).length);
    expect(result.APP_NAME).toBe('envault');
  });
});

describe('sortByPrefix', () => {
  it('groups keys by prefix', () => {
    const result = sortByPrefix(sampleEnv);
    const keys = Object.keys(result);
    const appIdx = keys.indexOf('APP_NAME');
    const appPortIdx = keys.indexOf('APP_PORT');
    const dbHostIdx = keys.indexOf('DB_HOST');
    const dbPortIdx = keys.indexOf('DB_PORT');
    expect(appIdx).toBeLessThan(dbHostIdx);
    expect(appIdx).toBeLessThan(appPortIdx);
    expect(dbHostIdx).toBeLessThan(dbPortIdx);
  });

  it('handles keys without underscores', () => {
    const env = { ZEBRA: '1', APP_X: '2', ALPHA: '3' };
    const result = sortByPrefix(env);
    expect(Object.keys(result)).toContain('ZEBRA');
  });
});

describe('sortByCustomOrder', () => {
  it('places specified keys first in given order', () => {
    const order = ['APP_PORT', 'DB_HOST', 'AWS_REGION'];
    const result = sortByCustomOrder(sampleEnv, order);
    const keys = Object.keys(result);
    expect(keys[0]).toBe('APP_PORT');
    expect(keys[1]).toBe('DB_HOST');
    expect(keys[2]).toBe('AWS_REGION');
  });

  it('appends unspecified keys alphabetically after ordered keys', () => {
    const order = ['ZEBRA'];
    const result = sortByCustomOrder(sampleEnv, order);
    const keys = Object.keys(result);
    expect(keys[0]).toBe('ZEBRA');
    const rest = keys.slice(1);
    expect(rest).toEqual([...rest].sort());
  });

  it('throws if order is empty', () => {
    expect(() => sortByCustomOrder(sampleEnv, [])).toThrow();
  });

  it('throws if order is not an array', () => {
    expect(() => sortByCustomOrder(sampleEnv, null)).toThrow();
  });
});

describe('sortEnv', () => {
  it('defaults to alphabetical strategy', () => {
    const result = sortEnv(sampleEnv);
    const keys = Object.keys(result);
    expect(keys).toEqual([...keys].sort());
  });

  it('applies prefix strategy', () => {
    const result = sortEnv(sampleEnv, 'prefix');
    expect(Object.keys(result)).toContain('APP_NAME');
  });

  it('applies custom strategy with order option', () => {
    const result = sortEnv(sampleEnv, 'custom', { order: ['ZEBRA', 'APP_NAME'] });
    expect(Object.keys(result)[0]).toBe('ZEBRA');
  });

  it('throws on unknown strategy', () => {
    expect(() => sortEnv(sampleEnv, 'bogus')).toThrow(/Unknown sort strategy/);
  });
});

describe('listSortStrategies', () => {
  it('returns an array of strategy names', () => {
    const strategies = listSortStrategies();
    expect(strategies).toContain('alphabetical');
    expect(strategies).toContain('prefix');
    expect(strategies).toContain('custom');
  });
});
