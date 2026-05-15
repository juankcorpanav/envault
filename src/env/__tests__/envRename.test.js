const { renameKey, bulkRenameKeys } = require('../envRename');

jest.mock('../../vault/vaultAccess');
jest.mock('../envLock');
jest.mock('../envHistory');

const { readVault, writeVault } = require('../../vault/vaultAccess');
const { isLocked } = require('../envLock');
const { recordChange } = require('../envHistory');

beforeEach(() => {
  jest.clearAllMocks();
  isLocked.mockResolvedValue(false);
  recordChange.mockResolvedValue(undefined);
  writeVault.mockResolvedValue(undefined);
});

describe('renameKey', () => {
  it('renames an existing key', async () => {
    readVault.mockResolvedValue({ OLD_KEY: 'hello', OTHER: 'world' });
    const result = await renameKey('myVault', 'OLD_KEY', 'NEW_KEY');
    expect(result).toEqual({ oldKey: 'OLD_KEY', newKey: 'NEW_KEY', value: 'hello' });
    expect(writeVault).toHaveBeenCalledWith('myVault', { NEW_KEY: 'hello', OTHER: 'world' });
    expect(recordChange).toHaveBeenCalledWith('myVault', 'rename', { oldKey: 'OLD_KEY', newKey: 'NEW_KEY', value: 'hello' });
  });

  it('throws when vault is locked', async () => {
    isLocked.mockResolvedValue(true);
    await expect(renameKey('myVault', 'A', 'B')).rejects.toThrow('locked');
  });

  it('throws when oldKey does not exist', async () => {
    readVault.mockResolvedValue({ OTHER: 'x' });
    await expect(renameKey('myVault', 'MISSING', 'NEW')).rejects.toThrow('not found');
  });

  it('throws when newKey already exists without overwrite', async () => {
    readVault.mockResolvedValue({ OLD: '1', NEW: '2' });
    await expect(renameKey('myVault', 'OLD', 'NEW')).rejects.toThrow('already exists');
  });

  it('overwrites newKey when overwrite=true', async () => {
    readVault.mockResolvedValue({ OLD: '1', NEW: '2' });
    const result = await renameKey('myVault', 'OLD', 'NEW', { overwrite: true });
    expect(result.value).toBe('1');
    expect(writeVault).toHaveBeenCalledWith('myVault', { NEW: '1' });
  });

  it('throws when oldKey and newKey are the same', async () => {
    await expect(renameKey('myVault', 'KEY', 'KEY')).rejects.toThrow('different');
  });

  it('throws on invalid oldKey', async () => {
    await expect(renameKey('myVault', '', 'B')).rejects.toThrow('oldKey');
  });
});

describe('bulkRenameKeys', () => {
  it('renames multiple keys', async () => {
    readVault.mockResolvedValue({ A: '1', B: '2', C: '3' });
    const results = await bulkRenameKeys('myVault', { A: 'X', B: 'Y' });
    expect(results).toHaveLength(2);
    expect(writeVault).toHaveBeenCalledWith('myVault', { X: '1', Y: '2', C: '3' });
    expect(recordChange).toHaveBeenCalledWith('myVault', 'bulk-rename', { mapping: { A: 'X', B: 'Y' } });
  });

  it('throws when mapping is empty', async () => {
    await expect(bulkRenameKeys('myVault', {})).rejects.toThrow('at least one entry');
  });

  it('throws when a key is missing', async () => {
    readVault.mockResolvedValue({ A: '1' });
    await expect(bulkRenameKeys('myVault', { MISSING: 'X' })).rejects.toThrow('not found');
  });

  it('throws when vault is locked', async () => {
    isLocked.mockResolvedValue(true);
    await expect(bulkRenameKeys('myVault', { A: 'B' })).rejects.toThrow('locked');
  });

  it('throws on invalid mapping type', async () => {
    await expect(bulkRenameKeys('myVault', ['A', 'B'])).rejects.toThrow('plain object');
  });
});
