const { cloneVault, previewClone } = require('../envClone');

jest.mock('../../vault/vaultAccess');
jest.mock('../envLock');
jest.mock('../../audit/auditLog');

const { readVault, writeVault } = require('../../vault/vaultAccess');
const { isLocked } = require('../envLock');
const { logAuditEvent } = require('../../audit/auditLog');

beforeEach(() => {
  jest.clearAllMocks();
  isLocked.mockResolvedValue(false);
  logAuditEvent.mockResolvedValue(undefined);
});

describe('cloneVault', () => {
  it('clones all keys from source to empty target', async () => {
    readVault.mockResolvedValueOnce({ FOO: 'bar', BAZ: 'qux' });
    readVault.mockRejectedValueOnce(new Error('not found'));
    writeVault.mockResolvedValue(undefined);

    const result = await cloneVault('dev', 'staging');

    expect(writeVault).toHaveBeenCalledWith('staging', { FOO: 'bar', BAZ: 'qux' });
    expect(result.cloned).toEqual(expect.arrayContaining(['FOO', 'BAZ']));
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'clone_vault' }));
  });

  it('skips existing keys when overwrite is false', async () => {
    readVault.mockResolvedValueOnce({ FOO: 'bar', BAZ: 'qux' });
    readVault.mockResolvedValueOnce({ FOO: 'existing' });
    writeVault.mockResolvedValue(undefined);

    const result = await cloneVault('dev', 'staging');

    expect(result.cloned).toEqual(['BAZ']);
    expect(writeVault).toHaveBeenCalledWith('staging', { BAZ: 'qux' });
  });

  it('overwrites existing keys when overwrite is true', async () => {
    readVault.mockResolvedValueOnce({ FOO: 'bar', BAZ: 'qux' });
    writeVault.mockResolvedValue(undefined);

    const result = await cloneVault('dev', 'staging', { overwrite: true });

    expect(result.cloned).toEqual(expect.arrayContaining(['FOO', 'BAZ']));
  });

  it('filters by prefix', async () => {
    readVault.mockResolvedValueOnce({ DB_HOST: 'localhost', DB_PASS: 'secret', APP_NAME: 'envault' });
    readVault.mockRejectedValueOnce(new Error('not found'));
    writeVault.mockResolvedValue(undefined);

    const result = await cloneVault('dev', 'staging', { prefix: 'DB_' });

    expect(result.cloned).toEqual(expect.arrayContaining(['DB_HOST', 'DB_PASS']));
    expect(result.cloned).not.toContain('APP_NAME');
  });

  it('filters by explicit keys list', async () => {
    readVault.mockResolvedValueOnce({ FOO: '1', BAR: '2', BAZ: '3' });
    readVault.mockRejectedValueOnce(new Error('not found'));
    writeVault.mockResolvedValue(undefined);

    const result = await cloneVault('dev', 'staging', { keys: ['FOO', 'BAZ'] });

    expect(result.cloned).toEqual(expect.arrayContaining(['FOO', 'BAZ']));
    expect(result.cloned).not.toContain('BAR');
  });

  it('throws when source and target are the same', async () => {
    await expect(cloneVault('dev', 'dev')).rejects.toThrow('must be different');
  });

  it('throws when source vault is locked', async () => {
    isLocked.mockResolvedValueOnce(true);
    await expect(cloneVault('dev', 'staging')).rejects.toThrow('locked');
  });

  it('throws when target vault is locked', async () => {
    isLocked.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await expect(cloneVault('dev', 'staging')).rejects.toThrow('locked');
  });
});

describe('previewClone', () => {
  it('returns willClone and willSkip lists', async () => {
    readVault.mockResolvedValueOnce({ FOO: '1', BAR: '2', BAZ: '3' });
    readVault.mockResolvedValueOnce({ FOO: 'existing' });

    const { willClone, willSkip } = await previewClone('dev', 'staging');

    expect(willClone).toEqual(expect.arrayContaining(['BAR', 'BAZ']));
    expect(willSkip).toEqual(['FOO']);
  });

  it('returns all keys as willClone when target does not exist', async () => {
    readVault.mockResolvedValueOnce({ A: '1', B: '2' });
    readVault.mockRejectedValueOnce(new Error('not found'));

    const { willClone, willSkip } = await previewClone('dev', 'staging');

    expect(willClone).toEqual(expect.arrayContaining(['A', 'B']));
    expect(willSkip).toHaveLength(0);
  });

  it('does not call writeVault', async () => {
    readVault.mockResolvedValueOnce({ X: '1' });
    readVault.mockRejectedValueOnce(new Error('not found'));

    await previewClone('dev', 'staging');

    expect(writeVault).not.toHaveBeenCalled();
  });
});
