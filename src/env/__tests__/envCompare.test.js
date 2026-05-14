const { compareProfiles, compareVaults, compareProfileToVault, changedKeys } = require('../envCompare');
const envProfile = require('../envProfile');
const vaultAccess = require('../../vault/vaultAccess');
const envDiff = require('../../diff/envDiff');

jest.mock('../envProfile');
jest.mock('../../vault/vaultAccess');
jest.mock('../../diff/envDiff');

const envA = { KEY1: 'a', KEY2: 'same' };
const envB = { KEY1: 'b', KEY3: 'new' };
const mockDiff = { added: { KEY3: 'new' }, removed: { KEY2: 'same' }, changed: { KEY1: { from: 'a', to: 'b' } } };
const mockSummary = '+ KEY3\n- KEY2\n~ KEY1';

beforeEach(() => {
  jest.clearAllMocks();
  envDiff.diffEnv.mockReturnValue(mockDiff);
  envDiff.formatDiff.mockReturnValue(mockSummary);
});

describe('compareProfiles', () => {
  it('loads both profiles and diffs them', () => {
    envProfile.loadProfile.mockReturnValueOnce(envA).mockReturnValueOnce(envB);
    const result = compareProfiles('dev', 'prod');
    expect(envProfile.loadProfile).toHaveBeenCalledWith('dev');
    expect(envProfile.loadProfile).toHaveBeenCalledWith('prod');
    expect(envDiff.diffEnv).toHaveBeenCalledWith(envA, envB);
    expect(result.diff).toBe(mockDiff);
    expect(result.summary).toBe(mockSummary);
  });
});

describe('compareVaults', () => {
  it('reads both vaults and diffs them', () => {
    vaultAccess.readVault.mockReturnValueOnce(envA).mockReturnValueOnce(envB);
    const result = compareVaults('/a/.env', '/b/.env');
    expect(vaultAccess.readVault).toHaveBeenCalledWith('/a/.env');
    expect(vaultAccess.readVault).toHaveBeenCalledWith('/b/.env');
    expect(result.diff).toBe(mockDiff);
    expect(result.summary).toBe(mockSummary);
  });
});

describe('compareProfileToVault', () => {
  it('loads profile and vault then diffs', () => {
    envProfile.loadProfile.mockReturnValueOnce(envA);
    vaultAccess.readVault.mockReturnValueOnce(envB);
    const result = compareProfileToVault('dev', '/b/.env');
    expect(envProfile.loadProfile).toHaveBeenCalledWith('dev');
    expect(vaultAccess.readVault).toHaveBeenCalledWith('/b/.env');
    expect(result.diff).toBe(mockDiff);
  });
});

describe('changedKeys', () => {
  it('returns union of added, removed and changed keys', () => {
    envDiff.diffEnv.mockReturnValue(mockDiff);
    const keys = changedKeys(envA, envB);
    expect(keys).toEqual(expect.arrayContaining(['KEY3', 'KEY2', 'KEY1']));
    expect(keys).toHaveLength(3);
  });

  it('returns empty array when no diff', () => {
    envDiff.diffEnv.mockReturnValue({});
    const keys = changedKeys(envA, envA);
    expect(keys).toEqual([]);
  });
});
