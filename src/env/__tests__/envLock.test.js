const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
const LOCK_DIR_KEY = path.resolve('.envault', 'locks');

jest.mock('fs');

const { lockVault, unlockVault, isLocked, getLockInfo, listLocks } = require('../envLock');

beforeEach(() => {
  jest.resetAllMocks();
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
});

describe('lockVault', () => {
  it('creates a lock file with correct data', () => {
    fs.writeFileSync.mockImplementation(() => {});
    const result = lockVault('myapp', 'alice', 'deploy freeze');
    expect(result.vaultName).toBe('myapp');
    expect(result.lockedBy).toBe('alice');
    expect(result.reason).toBe('deploy freeze');
    expect(result.lockedAt).toBeDefined();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('throws if vault is already locked', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ lockedBy: 'bob', lockedAt: '2024-01-01T00:00:00.000Z' }));
    expect(() => lockVault('myapp', 'alice')).toThrow(/already locked by bob/);
  });
});

describe('unlockVault', () => {
  it('removes the lock file and returns unlock info', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ vaultName: 'myapp', lockedBy: 'alice', lockedAt: '2024-01-01T00:00:00.000Z' }));
    fs.unlinkSync.mockImplementation(() => {});
    const result = unlockVault('myapp', 'alice');
    expect(result.unlockedBy).toBe('alice');
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  it('throws if vault is not locked', () => {
    fs.existsSync.mockReturnValue(false);
    expect(() => unlockVault('myapp')).toThrow(/not locked/);
  });
});

describe('isLocked', () => {
  it('returns true when lock file exists', () => {
    fs.existsSync.mockReturnValue(true);
    expect(isLocked('myapp')).toBe(true);
  });

  it('returns false when no lock file', () => {
    fs.existsSync.mockReturnValue(false);
    expect(isLocked('myapp')).toBe(false);
  });
});

describe('getLockInfo', () => {
  it('returns parsed lock data when locked', () => {
    const data = { vaultName: 'myapp', lockedBy: 'carol', lockedAt: '2024-06-01T12:00:00.000Z' };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(data));
    expect(getLockInfo('myapp')).toEqual(data);
  });

  it('returns null when not locked', () => {
    fs.existsSync.mockReturnValue(false);
    expect(getLockInfo('myapp')).toBeNull();
  });
});

describe('listLocks', () => {
  it('returns all active locks', () => {
    const lock1 = { vaultName: 'a', lockedBy: 'x', lockedAt: '2024-01-01T00:00:00.000Z' };
    const lock2 = { vaultName: 'b', lockedBy: 'y', lockedAt: '2024-01-02T00:00:00.000Z' };
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(['a.lock', 'b.lock']);
    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(lock1))
      .mockReturnValueOnce(JSON.stringify(lock2));
    const result = listLocks();
    expect(result).toHaveLength(2);
    expect(result[0].vaultName).toBe('a');
  });

  it('returns empty array when no locks', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue([]);
    expect(listLocks()).toEqual([]);
  });
});
