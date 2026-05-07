const fs = require('fs');
const path = require('path');
const { readEnvFile, mergeEnv, importEnvToVault } = require('../envImporter');

jest.mock('../../vault/vaultAccess');
jest.mock('../../audit/auditLog');

const { readVault, writeVault } = require('../../vault/vaultAccess');
const { logAuditEvent } = require('../../audit/auditLog');

describe('readEnvFile', () => {
  it('parses a valid .env file', () => {
    const tmpFile = path.join(__dirname, 'tmp_test.env');
    fs.writeFileSync(tmpFile, 'FOO=bar\nBAZ=qux\n');
    const result = readEnvFile(tmpFile);
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
    fs.unlinkSync(tmpFile);
  });

  it('throws if file does not exist', () => {
    expect(() => readEnvFile('/nonexistent/path/.env')).toThrow('File not found');
  });
});

describe('mergeEnv', () => {
  const existing = { FOO: 'old', KEEP: 'yes' };
  const incoming = { FOO: 'new', ADDED: 'value' };

  it('does not overwrite by default', () => {
    const result = mergeEnv(existing, incoming, false);
    expect(result.FOO).toBe('old');
    expect(result.ADDED).toBe('value');
    expect(result.KEEP).toBe('yes');
  });

  it('overwrites when flag is true', () => {
    const result = mergeEnv(existing, incoming, true);
    expect(result.FOO).toBe('new');
    expect(result.ADDED).toBe('value');
  });

  it('returns all keys from both objects', () => {
    const result = mergeEnv(existing, incoming, false);
    expect(Object.keys(result)).toEqual(expect.arrayContaining(['FOO', 'KEEP', 'ADDED']));
  });
});

describe('importEnvToVault', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readVault.mockResolvedValue({ EXISTING: 'val' });
    writeVault.mockResolvedValue();
    logAuditEvent.mockResolvedValue();
  });

  it('writes merged vault and logs audit event', async () => {
    const tmpFile = path.join(__dirname, 'tmp_import.env');
    fs.writeFileSync(tmpFile, 'NEW_KEY=secret\n');

    const summary = await importEnvToVault('myVault', tmpFile);
    expect(writeVault).toHaveBeenCalledWith('myVault', { EXISTING: 'val', NEW_KEY: 'secret' });
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'import', vault: 'myVault' }));
    expect(summary.imported).toBe(1);
    expect(summary.skipped).toBe(0);

    fs.unlinkSync(tmpFile);
  });

  it('reports skipped keys when overwrite is false', async () => {
    const tmpFile = path.join(__dirname, 'tmp_skip.env');
    fs.writeFileSync(tmpFile, 'EXISTING=newval\n');

    const summary = await importEnvToVault('myVault', tmpFile, { overwrite: false });
    expect(summary.skipped).toBe(1);
    expect(summary.overwritten).toBe(0);

    fs.unlinkSync(tmpFile);
  });
});
