const fs = require('fs');
const path = require('path');
const { saveToVault, loadFromVault, listVaults } = require('../vaultManager');

const TEST_VAULT_DIR = path.join(__dirname, '__test_vault__');
const TEST_PASSPHRASE = 'super-secret-passphrase-123';
const TEST_ENV_CONTENT = 'DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=abc123secret';
const TEST_ENV_NAME = 'test-env';

afterEach(() => {
  if (fs.existsSync(TEST_VAULT_DIR)) {
    fs.rmSync(TEST_VAULT_DIR, { recursive: true, force: true });
  }
});

describe('vaultManager', () => {
  describe('saveToVault', () => {
    it('should save an encrypted vault file and return its path', async () => {
      const filePath = await saveToVault(TEST_ENV_CONTENT, TEST_ENV_NAME, TEST_PASSPHRASE, TEST_VAULT_DIR);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(filePath).toContain(`${TEST_ENV_NAME}.vault`);
    });

    it('should create the vault directory if it does not exist', async () => {
      await saveToVault(TEST_ENV_CONTENT, TEST_ENV_NAME, TEST_PASSPHRASE, TEST_VAULT_DIR);
      expect(fs.existsSync(TEST_VAULT_DIR)).toBe(true);
    });

    it('should throw if envContent is empty', async () => {
      await expect(saveToVault('', TEST_ENV_NAME, TEST_PASSPHRASE, TEST_VAULT_DIR)).rejects.toThrow();
    });

    it('should throw if no valid key-value pairs are found', async () => {
      await expect(saveToVault('not valid env content!!!', TEST_ENV_NAME, TEST_PASSPHRASE, TEST_VAULT_DIR)).rejects.toThrow('No valid key-value pairs found');
    });

    it('should throw if passphrase is missing', async () => {
      await expect(saveToVault(TEST_ENV_CONTENT, TEST_ENV_NAME, '', TEST_VAULT_DIR)).rejects.toThrow();
    });
  });

  describe('loadFromVault', () => {
    it('should decrypt and return parsed env variables', async () => {
      await saveToVault(TEST_ENV_CONTENT, TEST_ENV_NAME, TEST_PASSPHRASE, TEST_VAULT_DIR);
      const result = await loadFromVault(TEST_ENV_NAME, TEST_PASSPHRASE, TEST_VAULT_DIR);
      expect(result).toMatchObject({ DB_HOST: 'localhost', DB_PORT: '5432', API_KEY: 'abc123secret' });
    });

    it('should throw if vault file does not exist', async () => {
      await expect(loadFromVault('nonexistent', TEST_PASSPHRASE, TEST_VAULT_DIR)).rejects.toThrow('Vault file not found');
    });

    it('should throw if passphrase is incorrect', async () => {
      await saveToVault(TEST_ENV_CONTENT, TEST_ENV_NAME, TEST_PASSPHRASE, TEST_VAULT_DIR);
      await expect(loadFromVault(TEST_ENV_NAME, 'wrong-passphrase', TEST_VAULT_DIR)).rejects.toThrow();
    });
  });

  describe('listVaults', () => {
    it('should return an empty array if vault directory does not exist', () => {
      expect(listVaults(TEST_VAULT_DIR)).toEqual([]);
    });

    it('should list saved vault environment names', async () => {
      await saveToVault(TEST_ENV_CONTENT, 'staging', TEST_PASSPHRASE, TEST_VAULT_DIR);
      await saveToVault(TEST_ENV_CONTENT, 'production', TEST_PASSPHRASE, TEST_VAULT_DIR);
      const vaults = listVaults(TEST_VAULT_DIR);
      expect(vaults).toContain('staging');
      expect(vaults).toContain('production');
      expect(vaults).toHaveLength(2);
    });
  });
});
