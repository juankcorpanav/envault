const { filterEnv, filterByPattern, filterByType, filterByKeys, filterEnvFile } = require('../envFilter');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('filterEnv', () => {
  const env = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    ENABLE_CACHE: 'true',
    SECRET_KEY: 'abc123',
    EMPTY_VAR: '',
    API_URL: 'https://api.example.com',
  };

  test('filters entries by predicate', () => {
    const result = filterEnv(env, (key) => key.startsWith('DB_'));
    expect(result).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });

  test('returns empty object when no entries match', () => {
    const result = filterEnv(env, () => false);
    expect(result).toEqual({});
  });

  test('returns all entries when predicate always true', () => {
    const result = filterEnv(env, () => true);
    expect(result).toEqual(env);
  });
});

describe('filterByPattern', () => {
  const env = { DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'envault' };

  test('filters by string pattern (regex)', () => {
    const result = filterByPattern(env, '^DB_');
    expect(Object.keys(result)).toEqual(['DB_HOST', 'DB_PORT']);
  });

  test('filters by RegExp', () => {
    const result = filterByPattern(env, /APP/);
    expect(result).toEqual({ APP_NAME: 'envault' });
  });
});

describe('filterByType', () => {
  const env = {
    FLAG: 'true',
    PORT: '3000',
    NAME: 'envault',
    ENDPOINT: 'https://api.example.com',
    EMPTY: '',
  };

  test('filters boolean values', () => {
    expect(filterByType(env, 'boolean')).toEqual({ FLAG: 'true' });
  });

  test('filters number values', () => {
    expect(filterByType(env, 'number')).toEqual({ PORT: '3000' });
  });

  test('filters string values', () => {
    expect(filterByType(env, 'string')).toEqual({ NAME: 'envault' });
  });

  test('filters url values', () => {
    expect(filterByType(env, 'url')).toEqual({ ENDPOINT: 'https://api.example.com' });
  });

  test('filters empty values', () => {
    expect(filterByType(env, 'empty')).toEqual({ EMPTY: '' });
  });

  test('throws on unknown type', () => {
    expect(() => filterByType(env, 'unknown')).toThrow('Unknown type filter: unknown');
  });
});

describe('filterByKeys', () => {
  const env = { A: '1', B: '2', C: '3' };

  test('returns only specified keys', () => {
    expect(filterByKeys(env, ['A', 'C'])).toEqual({ A: '1', C: '3' });
  });

  test('ignores keys not present in env', () => {
    expect(filterByKeys(env, ['A', 'Z'])).toEqual({ A: '1' });
  });
});

describe('filterEnvFile', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envfilter-')); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  test('reads, filters, and writes env file', () => {
    const input = path.join(tmpDir, '.env');
    const output = path.join(tmpDir, '.env.filtered');
    fs.writeFileSync(input, 'DB_HOST=localhost\nDB_PORT=5432\nAPP_NAME=envault\n');
    const result = filterEnvFile(input, output, (key) => key.startsWith('DB_'));
    expect(result).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
    const written = fs.readFileSync(output, 'utf8');
    expect(written).toContain('DB_HOST=localhost');
    expect(written).not.toContain('APP_NAME');
  });
});
