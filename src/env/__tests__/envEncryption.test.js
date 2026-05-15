const {
  encryptValue,
  decryptValue,
  encryptEnvValues,
  decryptEnvValues
} = require('../envEncryption');

describe('envEncryption', () => {
  const passphrase = 'super-secret-passphrase';
  const wrongPassphrase = 'wrong-passphrase';

  describe('encryptValue / decryptValue', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const original = 'my-secret-value';
      const encrypted = await encryptValue(original, passphrase);
      expect(encrypted).not.toBe(original);
      const decrypted = await decryptValue(encrypted, passphrase);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same input (random IV/salt)', async () => {
      const original = 'same-value';
      const enc1 = await encryptValue(original, passphrase);
      const enc2 = await encryptValue(original, passphrase);
      expect(enc1).not.toBe(enc2);
    });

    it('should return a base64-encoded string', async () => {
      const encrypted = await encryptValue('hello', passphrase);
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should throw when decrypting with wrong passphrase', async () => {
      const encrypted = await encryptValue('secret', passphrase);
      await expect(decryptValue(encrypted, wrongPassphrase)).rejects.toThrow();
    });

    it('should handle empty string values', async () => {
      const encrypted = await encryptValue('', passphrase);
      const decrypted = await decryptValue(encrypted, passphrase);
      expect(decrypted).toBe('');
    });

    it('should handle values with special characters', async () => {
      const original = 'p@$$w0rd!#%^&*()=+[]{}|;:,.<>?';
      const encrypted = await encryptValue(original, passphrase);
      const decrypted = await decryptValue(encrypted, passphrase);
      expect(decrypted).toBe(original);
    });
  });

  describe('encryptEnvValues / decryptEnvValues', () => {
    const env = {
      DB_HOST: 'localhost',
      DB_PASS: 'hunter2',
      API_KEY: 'abc123xyz'
    };

    it('should encrypt all values in an env object', async () => {
      const encrypted = await encryptEnvValues(env, passphrase);
      expect(Object.keys(encrypted)).toEqual(Object.keys(env));
      for (const key of Object.keys(env)) {
        expect(encrypted[key]).not.toBe(env[key]);
      }
    });

    it('should round-trip encrypt then decrypt an env object', async () => {
      const encrypted = await encryptEnvValues(env, passphrase);
      const decrypted = await decryptEnvValues(encrypted, passphrase);
      expect(decrypted).toEqual(env);
    });

    it('should handle an empty env object', async () => {
      const encrypted = await encryptEnvValues({}, passphrase);
      expect(encrypted).toEqual({});
      const decrypted = await decryptEnvValues({}, passphrase);
      expect(decrypted).toEqual({});
    });

    it('should fail decryption with wrong passphrase on any key', async () => {
      const encrypted = await encryptEnvValues(env, passphrase);
      await expect(decryptEnvValues(encrypted, wrongPassphrase)).rejects.toThrow();
    });
  });
});
