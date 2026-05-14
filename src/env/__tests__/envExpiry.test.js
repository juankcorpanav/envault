const fs = require('fs');
const path = require('path');

jest.mock('fs');

const EXPIRY_DIR = path.join(process.cwd(), '.envault', 'expiry');

function freshModule() {
  jest.resetModules();
  return require('../envExpiry');
}

describe('envExpiry', () => {
  let expiry;
  const vault = 'myapp';
  const filePath = path.join(EXPIRY_DIR, `${vault}.expiry.json`);

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    expiry = freshModule();
  });

  describe('setExpiry', () => {
    it('should write expiry timestamp for a key', () => {
      const before = Date.now();
      const ts = expiry.setExpiry(vault, 'DB_PASS', 3600);
      expect(ts).toBeGreaterThanOrEqual(before + 3600 * 1000);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('DB_PASS')
      );
    });

    it('should throw if ttlSeconds is not a positive number', () => {
      expect(() => expiry.setExpiry(vault, 'KEY', -1)).toThrow();
      expect(() => expiry.setExpiry(vault, 'KEY', 0)).toThrow();
      expect(() => expiry.setExpiry(vault, 'KEY', 'abc')).toThrow();
    });
  });

  describe('removeExpiry', () => {
    it('should remove an existing expiry entry', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({ DB_PASS: Date.now() + 9999 }));
      const result = expiry.removeExpiry(vault, 'DB_PASS');
      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should return false if key has no expiry', () => {
      const result = expiry.removeExpiry(vault, 'NO_EXPIRY_KEY');
      expect(result).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return true for a past timestamp', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({ OLD_KEY: Date.now() - 1000 }));
      expect(expiry.isExpired(vault, 'OLD_KEY')).toBe(true);
    });

    it('should return false for a future timestamp', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({ FRESH_KEY: Date.now() + 100000 }));
      expect(expiry.isExpired(vault, 'FRESH_KEY')).toBe(false);
    });

    it('should return false if key has no expiry set', () => {
      expect(expiry.isExpired(vault, 'UNKNOWN')).toBe(false);
    });
  });

  describe('listExpiredKeys', () => {
    it('should return only expired keys', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        EXPIRED: Date.now() - 5000,
        ACTIVE: Date.now() + 5000,
      }));
      const result = expiry.listExpiredKeys(vault);
      expect(result).toEqual(['EXPIRED']);
    });
  });

  describe('listExpiryEntries', () => {
    it('should return enriched entries with expired flag', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        A: Date.now() - 1000,
        B: Date.now() + 100000,
      }));
      const entries = expiry.listExpiryEntries(vault);
      expect(entries).toHaveLength(2);
      const a = entries.find(e => e.key === 'A');
      const b = entries.find(e => e.key === 'B');
      expect(a.expired).toBe(true);
      expect(b.expired).toBe(false);
      expect(typeof a.expiresAt).toBe('string');
    });
  });
});
