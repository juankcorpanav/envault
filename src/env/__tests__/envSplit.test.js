const { splitByPrefix, splitByClassifier, writeSplitFiles, splitEnvFile } = require('../envSplit');
const fs = require('fs');
const path = require('path');
const os = require('os');

const sampleEnv = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  AWS_KEY: 'abc123',
  AWS_SECRET: 'xyz',
  APP_NAME: 'envault',
  DEBUG: 'true',
};

describe('splitByPrefix', () => {
  it('splits keys into groups by prefix', () => {
    const { groups, remainder } = splitByPrefix(sampleEnv, ['DB_', 'AWS_']);
    expect(Object.keys(groups)).toEqual(expect.arrayContaining(['DB', 'AWS']));
    expect(groups['DB']).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
    expect(groups['AWS']).toEqual({ AWS_KEY: 'abc123', AWS_SECRET: 'xyz' });
  });

  it('puts unmatched keys in remainder', () => {
    const { remainder } = splitByPrefix(sampleEnv, ['DB_', 'AWS_']);
    expect(remainder).toEqual({ APP_NAME: 'envault', DEBUG: 'true' });
  });

  it('returns empty groups if no prefixes match', () => {
    const { groups, remainder } = splitByPrefix(sampleEnv, ['NOPE_']);
    expect(Object.keys(groups)).toHaveLength(0);
    expect(remainder).toEqual(sampleEnv);
  });

  it('handles empty env object', () => {
    const { groups, remainder } = splitByPrefix({}, ['DB_']);
    expect(groups).toEqual({});
    expect(remainder).toEqual({});
  });
});

describe('splitByClassifier', () => {
  it('groups keys using classifier function', () => {
    const classifier = (key) => key.includes('DB') ? 'database' : null;
    const { groups, remainder } = splitByClassifier(sampleEnv, classifier);
    expect(groups['database']).toHaveProperty('DB_HOST');
    expect(remainder).not.toHaveProperty('DB_HOST');
  });

  it('puts all keys in remainder if classifier returns null always', () => {
    const { groups, remainder } = splitByClassifier(sampleEnv, () => null);
    expect(Object.keys(groups)).toHaveLength(0);
    expect(remainder).toEqual(sampleEnv);
  });
});

describe('writeSplitFiles', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-split-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes group files to output directory', () => {
    const result = { groups: { DB: { DB_HOST: 'localhost' } }, remainder: {} };
    const written = writeSplitFiles(result, tmpDir);
    expect(written).toHaveLength(1);
    expect(fs.existsSync(path.join(tmpDir, '.env.db'))).toBe(true);
  });

  it('writes remainder file when remainder is non-empty', () => {
    const result = { groups: {}, remainder: { DEBUG: 'true' } };
    const written = writeSplitFiles(result, tmpDir, 'misc');
    expect(written).toHaveLength(1);
    expect(fs.existsSync(path.join(tmpDir, '.env.misc'))).toBe(true);
  });

  it('creates output directory if it does not exist', () => {
    const nested = path.join(tmpDir, 'nested', 'out');
    const result = { groups: { APP: { APP_NAME: 'test' } }, remainder: {} };
    writeSplitFiles(result, nested);
    expect(fs.existsSync(nested)).toBe(true);
  });
});

describe('splitEnvFile', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-split-file-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads, splits, and writes env file', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'DB_HOST=localhost\nAPP_NAME=test\n', 'utf8');
    const outDir = path.join(tmpDir, 'out');
    const written = splitEnvFile(envFile, ['DB_'], outDir);
    expect(written.some(f => f.includes('.env.db'))).toBe(true);
  });
});
