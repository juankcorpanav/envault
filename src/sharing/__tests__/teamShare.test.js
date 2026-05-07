const { encryptEnv, decryptEnv } = require('../teamShare');

describe('teamShare', () => {
  const sampleEnv = {
    API_KEY: 'supersecret123',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    NODE_ENV: 'production',
  };

  const passphrase = 'my-team-secret-passphrase';

  describe('encryptEnv', () => {
    it('should return an object with iv, tag, and data fields', () => {
      const result = encryptEnv(sampleEnv, passphrase);
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('tag');
      expect(result).toHaveProperty('data');
    });

    it('should produce hex-encoded strings', () => {
      const result = encryptEnv(sampleEnv, passphrase);
      expect(result.iv).toMatch(/^[0-9a-f]+$/i);
      expect(result.tag).toMatch(/^[0-9a-f]+$/i);
      expect(result.data).toMatch(/^[0-9a-f]+$/i);
    });

    it('should produce different ciphertext on each call (random IV)', () => {
      const result1 = encryptEnv(sampleEnv, passphrase);
      const result2 = encryptEnv(sampleEnv, passphrase);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.data).not.toBe(result2.data);
    });

    it('should throw if passphrase is missing', () => {
      expect(() => encryptEnv(sampleEnv, '')).toThrow('valid passphrase');
      expect(() => encryptEnv(sampleEnv, null)).toThrow('valid passphrase');
    });
  });

  describe('decryptEnv', () => {
    it('should decrypt back to the original env object', () => {
      const payload = encryptEnv(sampleEnv, passphrase);
      const result = decryptEnv(payload, passphrase);
      expect(result).toEqual(sampleEnv);
    });

    it('should throw with a wrong passphrase', () => {
      const payload = encryptEnv(sampleEnv, passphrase);
      expect(() => decryptEnv(payload, 'wrong-passphrase')).toThrow();
    });

    it('should throw if payload fields are missing', () => {
      expect(() => decryptEnv({ iv: 'abc' }, passphrase)).toThrow('Invalid payload');
      expect(() => decryptEnv({}, passphrase)).toThrow('Invalid payload');
    });

    it('should throw if passphrase is missing', () => {
      const payload = encryptEnv(sampleEnv, passphrase);
      expect(() => decryptEnv(payload, '')).toThrow('valid passphrase');
    });

    it('should handle env with special characters in values', () => {
      const specialEnv = { SECRET: 'p@$$w0rd!#%', URL: 'https://example.com?a=1&b=2' };
      const payload = encryptEnv(specialEnv, passphrase);
      const result = decryptEnv(payload, passphrase);
      expect(result).toEqual(specialEnv);
    });
  });
});
