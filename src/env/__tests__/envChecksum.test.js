const fs = require('fs');
const path = require('path');

jest.mock('fs');

let envChecksum;

function freshModule() {
  jest.resetModules();
  envChecksum = require('../envChecksum');
}

beforeEach(() => {
  jest.clearAllMocks();
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  freshModule();
});

describe('computeChecksum', () => {
  it('returns a 64-char hex sha256 string', () => {
    const result = envChecksum.computeChecksum({ FOO: 'bar', BAZ: 'qux' });
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces the same checksum regardless of key order', () => {
    const a = envChecksum.computeChecksum({ A: '1', B: '2' });
    const b = envChecksum.computeChecksum({ B: '2', A: '1' });
    expect(a).toBe(b);
  });

  it('produces different checksums for different values', () => {
    const a = envChecksum.computeChecksum({ A: '1' });
    const b = envChecksum.computeChecksum({ A: '2' });
    expect(a).not.toBe(b);
  });
});

describe('saveChecksum', () => {
  it('creates checksum dir and writes file', () => {
    const checksum = envChecksum.saveChecksum('myVault', { KEY: 'value' });
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('loadChecksum', () => {
  it('returns null if no checksum file exists', () => {
    fs.existsSync.mockReturnValue(false);
    const result = envChecksum.loadChecksum('missing');
    expect(result).toBeNull();
  });

  it('returns parsed record when file exists', () => {
    const record = { vaultName: 'v', checksum: 'abc123', savedAt: '2024-01-01T00:00:00.000Z' };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(record));
    const result = envChecksum.loadChecksum('v');
    expect(result).toEqual(record);
  });
});

describe('verifyChecksum', () => {
  it('returns invalid with reason when no record found', () => {
    fs.existsSync.mockReturnValue(false);
    const result = envChecksum.verifyChecksum('vault', { A: '1' });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/No checksum record found/);
  });

  it('returns valid when checksum matches', () => {
    const env = { KEY: 'secret' };
    const checksum = envChecksum.computeChecksum(env);
    const record = { vaultName: 'v', checksum, savedAt: '2024-01-01T00:00:00.000Z' };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(record));
    const result = envChecksum.verifyChecksum('v', env);
    expect(result.valid).toBe(true);
    expect(result.reason).toMatch(/matches/);
  });

  it('returns invalid when checksum does not match', () => {
    const record = { vaultName: 'v', checksum: 'deadbeef', savedAt: '2024-01-01T00:00:00.000Z' };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(record));
    const result = envChecksum.verifyChecksum('v', { KEY: 'tampered' });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/mismatch/);
  });
});

describe('deleteChecksum', () => {
  it('returns false if file does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    expect(envChecksum.deleteChecksum('ghost')).toBe(false);
  });

  it('unlinks file and returns true if it exists', () => {
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});
    expect(envChecksum.deleteChecksum('vault')).toBe(true);
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
});
