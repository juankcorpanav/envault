const fs = require('fs');
const path = require('path');
const { exportToFile, exportToObject } = require('../envExporter');
const { readVault } = require('../../vault/vaultAccess');
const { serializeEnv } = require('../../secrets/envParser');
const { logAuditEvent } = require('../../audit/auditLog');

jest.mock('../../vault/vaultAccess');
jest.mock('../../secrets/envParser');
jest.mock('../../audit/auditLog');
jest.mock('fs');

const MOCK_SECRETS = { API_KEY: 'abc123', DB_PASS: 'secret', PORT: '3000' };
const MOCK_SERIALIZED = 'API_KEY=abc123\nDB_PASS=secret\nPORT=3000\n';

beforeEach(() => {
  jest.clearAllMocks();
  readVault.mockResolvedValue({ ...MOCK_SECRETS });
  serializeEnv.mockReturnValue(MOCK_SERIALIZED);
  logAuditEvent.mockResolvedValue(undefined);
  fs.existsSync.mockReturnValue(false);
  fs.writeFileSync.mockReturnValue(undefined);
});

describe('exportToFile', () => {
  it('writes all secrets to file when no keys filter provided', async () => {
    const result = await exportToFile('myVault', './output.env');
    expect(readVault).toHaveBeenCalledWith('myVault');
    expect(serializeEnv).toHaveBeenCalledWith(MOCK_SECRETS);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.resolve('./output.env'),
      MOCK_SERIALIZED,
      'utf8'
    );
    expect(result).toBe(path.resolve('./output.env'));
  });

  it('writes only specified keys when keys option provided', async () => {
    await exportToFile('myVault', './output.env', { keys: ['API_KEY', 'PORT'] });
    expect(serializeEnv).toHaveBeenCalledWith({ API_KEY: 'abc123', PORT: '3000' });
  });

  it('throws if file exists and overwrite is false', async () => {
    fs.existsSync.mockReturnValue(true);
    await expect(exportToFile('myVault', './output.env')).rejects.toThrow(
      'File already exists'
    );
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('overwrites file when overwrite option is true', async () => {
    fs.existsSync.mockReturnValue(true);
    await expect(
      exportToFile('myVault', './output.env', { overwrite: true })
    ).resolves.toBeDefined();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('logs an audit event after successful export', async () => {
    await exportToFile('myVault', './output.env');
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'export', vault: 'myVault' })
    );
  });
});

describe('exportToObject', () => {
  it('returns all secrets when no keys filter provided', async () => {
    const result = await exportToObject('myVault');
    expect(result).toEqual(MOCK_SECRETS);
  });

  it('returns only specified keys', async () => {
    const result = await exportToObject('myVault', ['DB_PASS']);
    expect(result).toEqual({ DB_PASS: 'secret' });
  });

  it('ignores keys not present in vault', async () => {
    const result = await exportToObject('myVault', ['API_KEY', 'MISSING_KEY']);
    expect(result).toEqual({ API_KEY: 'abc123' });
  });

  it('returns a copy, not a reference to internal state', async () => {
    const result = await exportToObject('myVault');
    result.API_KEY = 'tampered';
    const result2 = await exportToObject('myVault');
    expect(result2.API_KEY).toBe('abc123');
  });
});
