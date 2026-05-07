const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
  process.env.ENVAULT_DIR = tmpDir;
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.ENVAULT_DIR;
});

const getModule = () => require('../vaultAccess');

describe('writeVault / readVault', () => {
  it('writes and reads back env data correctly', () => {
    const { writeVault, readVault } = getModule();
    writeVault('myapp', { API_KEY: 'abc123', DB_URL: 'postgres://localhost/db' });
    const data = readVault('myapp');
    expect(data).toEqual({ API_KEY: 'abc123', DB_URL: 'postgres://localhost/db' });
  });

  it('creates vault directory if it does not exist', () => {
    const { writeVault } = getModule();
    writeVault('newvault', { SECRET: 'value' });
    expect(fs.existsSync(path.join(tmpDir, 'newvault', '.env'))).toBe(true);
  });

  it('throws when reading a non-existent vault', () => {
    const { readVault } = getModule();
    expect(() => readVault('ghost')).toThrow('Vault not found: ghost');
  });

  it('throws on invalid vault name', () => {
    const { writeVault } = getModule();
    expect(() => writeVault('', { KEY: 'val' })).toThrow('Invalid vault name');
  });
});

describe('updateVault', () => {
  it('merges new keys with existing ones', () => {
    const { writeVault, updateVault } = getModule();
    writeVault('app', { EXISTING: 'yes' });
    const result = updateVault('app', { NEW_KEY: 'hello' });
    expect(result).toEqual({ EXISTING: 'yes', NEW_KEY: 'hello' });
  });

  it('creates vault if it does not exist yet', () => {
    const { updateVault, readVault } = getModule();
    updateVault('fresh', { ONLY: 'one' });
    expect(readVault('fresh')).toEqual({ ONLY: 'one' });
  });

  it('overwrites existing keys with updated values', () => {
    const { writeVault, updateVault } = getModule();
    writeVault('app', { TOKEN: 'old' });
    const result = updateVault('app', { TOKEN: 'new' });
    expect(result.TOKEN).toBe('new');
  });
});

describe('deleteVaultKey', () => {
  it('removes a key from the vault', () => {
    const { writeVault, deleteVaultKey, readVault } = getModule();
    writeVault('app', { A: '1', B: '2' });
    deleteVaultKey('app', 'A');
    expect(readVault('app')).toEqual({ B: '2' });
  });

  it('throws when deleting a key that does not exist', () => {
    const { writeVault, deleteVaultKey } = getModule();
    writeVault('app', { A: '1' });
    expect(() => deleteVaultKey('app', 'MISSING')).toThrow('Key "MISSING" not found in vault: app');
  });
});
