jest.mock('../../vault/vaultAccess');
jest.mock('../../vault/vaultManager');
jest.mock('../../secrets/secretRotation');
jest.mock('../../sharing/teamShare');
jest.mock('../../audit/auditLog');
jest.mock('../../secrets/envParser');

const { readVault, writeVault, updateVault, deleteVaultKey } = require('../../vault/vaultAccess');
const { listVaults } = require('../../vault/vaultManager');
const { rotateSecret } = require('../../secrets/secretRotation');
const { encryptEnv, decryptEnv } = require('../../sharing/teamShare');
const { logAuditEvent } = require('../../audit/auditLog');
const { parseEnv, serializeEnv } = require('../../secrets/envParser');
const { cmdGet, cmdSet, cmdDelete, cmdList, cmdRotate, cmdExport, cmdImport } = require('../cliCommands');

beforeEach(() => jest.clearAllMocks());

test('cmdList returns vault names', async () => {
  listVaults.mockResolvedValue(['prod', 'staging']);
  const result = await cmdList();
  expect(result).toEqual({ vaults: ['prod', 'staging'] });
});

test('cmdGet returns full vault when no key given', async () => {
  readVault.mockResolvedValue({ DB_URL: 'postgres://localhost', API_KEY: 'abc' });
  const result = await cmdGet('prod');
  expect(result).toEqual({ DB_URL: 'postgres://localhost', API_KEY: 'abc' });
});

test('cmdGet returns single key when key given', async () => {
  readVault.mockResolvedValue({ DB_URL: 'postgres://localhost', API_KEY: 'abc' });
  const result = await cmdGet('prod', 'API_KEY');
  expect(result).toEqual({ API_KEY: 'abc' });
});

test('cmdGet throws when vault not found', async () => {
  readVault.mockResolvedValue(null);
  await expect(cmdGet('missing')).rejects.toThrow('Vault "missing" not found.');
});

test('cmdGet throws when key not found', async () => {
  readVault.mockResolvedValue({ DB_URL: 'postgres://localhost' });
  await expect(cmdGet('prod', 'MISSING_KEY')).rejects.toThrow('Key "MISSING_KEY" not found');
});

test('cmdSet updates vault and logs audit event', async () => {
  updateVault.mockResolvedValue(true);
  logAuditEvent.mockResolvedValue(true);
  const result = await cmdSet('prod', 'API_KEY', 'newval');
  expect(updateVault).toHaveBeenCalledWith('prod', { API_KEY: 'newval' });
  expect(logAuditEvent).toHaveBeenCalledWith({ action: 'SET', vault: 'prod', key: 'API_KEY' });
  expect(result.success).toBe(true);
});

test('cmdDelete removes key and logs audit event', async () => {
  deleteVaultKey.mockResolvedValue(true);
  logAuditEvent.mockResolvedValue(true);
  const result = await cmdDelete('prod', 'OLD_KEY');
  expect(deleteVaultKey).toHaveBeenCalledWith('prod', 'OLD_KEY');
  expect(logAuditEvent).toHaveBeenCalledWith({ action: 'DELETE', vault: 'prod', key: 'OLD_KEY' });
  expect(result.success).toBe(true);
});

test('cmdRotate rotates secret and updates vault', async () => {
  readVault.mockResolvedValue({ SECRET: 'old' });
  rotateSecret.mockResolvedValue('newSecret123');
  updateVault.mockResolvedValue(true);
  logAuditEvent.mockResolvedValue(true);
  const result = await cmdRotate('prod', 'SECRET');
  expect(rotateSecret).toHaveBeenCalledWith('prod', 'SECRET', 'old');
  expect(updateVault).toHaveBeenCalledWith('prod', { SECRET: 'newSecret123' });
  expect(result.newValue).toBe('newSecret123');
});

test('cmdExport encrypts and logs audit event', async () => {
  readVault.mockResolvedValue({ API_KEY: 'abc' });
  serializeEnv.mockReturnValue('API_KEY=abc');
  encryptEnv.mockResolvedValue({ iv: 'iv123', data: 'encrypted' });
  logAuditEvent.mockResolvedValue(true);
  const result = await cmdExport('prod', 'mypassphrase');
  expect(encryptEnv).toHaveBeenCalledWith('API_KEY=abc', 'mypassphrase');
  expect(result).toEqual({ iv: 'iv123', data: 'encrypted' });
});

test('cmdImport decrypts, parses and writes vault', async () => {
  decryptEnv.mockResolvedValue('API_KEY=abc\nDB=pg');
  parseEnv.mockReturnValue({ API_KEY: 'abc', DB: 'pg' });
  writeVault.mockResolvedValue(true);
  logAuditEvent.mockResolvedValue(true);
  const result = await cmdImport('prod', { iv: 'iv123', data: 'encrypted' }, 'mypassphrase');
  expect(writeVault).toHaveBeenCalledWith('prod', { API_KEY: 'abc', DB: 'pg' });
  expect(result.keys).toEqual(['API_KEY', 'DB']);
});
