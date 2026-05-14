const { searchEnv, searchAcrossVaults, searchAcrossProfiles } = require('../envSearch');

jest.mock('../../vault/vaultManager');
jest.mock('../../vault/vaultAccess');
jest.mock('../envProfile');

const { listVaults } = require('../../vault/vaultManager');
const { readVault } = require('../../vault/vaultAccess');
const { listProfiles, loadProfile } = require('../envProfile');

const sampleEnv = {
  DATABASE_URL: 'postgres://localhost/mydb',
  API_KEY: 'secret-abc-123',
  APP_ENV: 'production',
  DEBUG: 'false',
};

describe('searchEnv', () => {
  test('finds keys by substring (case-insensitive)', () => {
    const result = searchEnv(sampleEnv, 'api');
    expect(result).toHaveProperty('API_KEY');
    expect(Object.keys(result)).toHaveLength(1);
  });

  test('finds values by substring', () => {
    const result = searchEnv(sampleEnv, 'postgres');
    expect(result).toHaveProperty('DATABASE_URL');
  });

  test('case-sensitive search respects case', () => {
    const resultSensitive = searchEnv(sampleEnv, 'api', { caseSensitive: true });
    expect(Object.keys(resultSensitive)).toHaveLength(0);
    const resultInsensitive = searchEnv(sampleEnv, 'api', { caseSensitive: false });
    expect(resultInsensitive).toHaveProperty('API_KEY');
  });

  test('regex search works', () => {
    const result = searchEnv(sampleEnv, '^APP', { regex: true, searchValues: false });
    expect(result).toHaveProperty('APP_ENV');
    expect(result).not.toHaveProperty('API_KEY');
  });

  test('searchKeys=false skips key matching', () => {
    const result = searchEnv(sampleEnv, 'DEBUG', { searchKeys: false, searchValues: true });
    expect(Object.keys(result)).toHaveLength(0);
  });

  test('searchValues=false skips value matching', () => {
    const result = searchEnv(sampleEnv, 'production', { searchValues: false });
    expect(Object.keys(result)).toHaveLength(0);
  });

  test('returns empty object when no matches', () => {
    const result = searchEnv(sampleEnv, 'NONEXISTENT_XYZ');
    expect(result).toEqual({});
  });
});

describe('searchAcrossVaults', () => {
  beforeEach(() => {
    listVaults.mockResolvedValue(['dev', 'prod']);
    readVault.mockImplementation((name) =>
      Promise.resolve(name === 'dev' ? sampleEnv : { ONLY_PROD: 'yes' })
    );
  });

  test('returns matches from vaults containing query', async () => {
    const results = await searchAcrossVaults('API_KEY');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('dev');
    expect(results[0].matches).toHaveProperty('API_KEY');
  });

  test('skips vaults that throw errors', async () => {
    readVault.mockRejectedValueOnce(new Error('locked'));
    const results = await searchAcrossVaults('API_KEY');
    expect(results).toHaveLength(0);
  });
});

describe('searchAcrossProfiles', () => {
  beforeEach(() => {
    listProfiles.mockResolvedValue(['default', 'staging']);
    loadProfile.mockImplementation((name) =>
      Promise.resolve(name === 'staging' ? { STAGE_KEY: 'stage-value', APP_ENV: 'staging' } : {})
    );
  });

  test('returns matches from profiles containing query', async () => {
    const results = await searchAcrossProfiles('STAGE');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('staging');
    expect(results[0].source).toBe('profile');
  });

  test('returns empty array when no profile matches', async () => {
    const results = await searchAcrossProfiles('NONEXISTENT');
    expect(results).toEqual([]);
  });
});
