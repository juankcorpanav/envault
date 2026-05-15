const { findMissingKeys, backfillFromProfile, backfillFromTemplate } = require('../envBackfill');

jest.mock('../envProfile');
jest.mock('../../vault/vaultAccess');
jest.mock('../../template/envTemplate');
jest.mock('fs');

const { loadProfile } = require('../envProfile');
const { readVault, updateVault } = require('../../vault/vaultAccess');
const { parseTemplate } = require('../../template/envTemplate');
const fs = require('fs');

describe('findMissingKeys', () => {
  it('returns keys in source not present in target', () => {
    const source = { A: '1', B: '2', C: '3' };
    const target = { A: '1' };
    expect(findMissingKeys(source, target)).toEqual({ B: '2', C: '3' });
  });

  it('returns empty object when target has all source keys', () => {
    const source = { A: '1' };
    const target = { A: '9', B: '2' };
    expect(findMissingKeys(source, target)).toEqual({});
  });

  it('returns all source keys when target is empty', () => {
    const source = { X: 'foo', Y: 'bar' };
    expect(findMissingKeys(source, {})).toEqual(source);
  });
});

describe('backfillFromProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds missing keys from profile to vault', async () => {
    loadProfile.mockResolvedValue({ A: '1', B: '2', C: '3' });
    readVault.mockResolvedValue({ A: 'existing' });
    updateVault.mockResolvedValue();

    const result = await backfillFromProfile('/vault.env', 'staging');
    expect(result.added).toEqual({ B: '2', C: '3' });
    expect(result.skipped).toContain('A');
    expect(updateVault).toHaveBeenCalledWith('/vault.env', { B: '2', C: '3' });
  });

  it('does not call updateVault on dry run', async () => {
    loadProfile.mockResolvedValue({ A: '1', B: '2' });
    readVault.mockResolvedValue({});
    updateVault.mockResolvedValue();

    const result = await backfillFromProfile('/vault.env', 'prod', { dryRun: true });
    expect(result.added).toEqual({ A: '1', B: '2' });
    expect(updateVault).not.toHaveBeenCalled();
  });

  it('returns empty added when vault already has all profile keys', async () => {
    loadProfile.mockResolvedValue({ A: '1' });
    readVault.mockResolvedValue({ A: 'x', B: 'y' });
    updateVault.mockResolvedValue();

    const result = await backfillFromProfile('/vault.env', 'dev');
    expect(result.added).toEqual({});
    expect(updateVault).not.toHaveBeenCalled();
  });
});

describe('backfillFromTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('backfills keys with defaults from template', async () => {
    fs.readFileSync.mockReturnValue('template content');
    parseTemplate.mockReturnValue({
      DB_HOST: { default: 'localhost' },
      DB_PORT: { default: '5432' },
      SECRET: {},
    });
    readVault.mockResolvedValue({ DB_HOST: 'prod-host' });
    updateVault.mockResolvedValue();

    const result = await backfillFromTemplate('/vault.env', '/tmpl.env');
    expect(result.added).toEqual({ DB_PORT: '5432' });
    expect(result.skipped).toContain('DB_HOST');
    expect(updateVault).toHaveBeenCalledWith('/vault.env', { DB_PORT: '5432' });
  });

  it('skips keys without defaults', async () => {
    fs.readFileSync.mockReturnValue('');
    parseTemplate.mockReturnValue({ NO_DEFAULT: {} });
    readVault.mockResolvedValue({});
    updateVault.mockResolvedValue();

    const result = await backfillFromTemplate('/vault.env', '/tmpl.env');
    expect(result.added).toEqual({});
    expect(updateVault).not.toHaveBeenCalled();
  });

  it('respects dry run option', async () => {
    fs.readFileSync.mockReturnValue('');
    parseTemplate.mockReturnValue({ KEY: { default: 'val' } });
    readVault.mockResolvedValue({});
    updateVault.mockResolvedValue();

    await backfillFromTemplate('/vault.env', '/tmpl.env', { dryRun: true });
    expect(updateVault).not.toHaveBeenCalled();
  });
});
