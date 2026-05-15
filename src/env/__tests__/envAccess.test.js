const fs = require('fs');
const path = require('path');

jest.mock('fs');

const ACCESS_DIR = path.resolve('.envault', 'access');

let envAccess;

beforeEach(() => {
  jest.resetModules();
  fs.existsSync = jest.fn().mockReturnValue(false);
  fs.mkdirSync = jest.fn();
  fs.writeFileSync = jest.fn();
  fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({}));
  envAccess = require('../envAccess');
});

describe('ensureAccessDir', () => {
  it('creates directory if it does not exist', () => {
    envAccess.ensureAccessDir();
    expect(fs.mkdirSync).toHaveBeenCalledWith(ACCESS_DIR, { recursive: true });
  });

  it('does not create directory if it already exists', () => {
    fs.existsSync.mockReturnValue(true);
    envAccess.ensureAccessDir();
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
});

describe('grantAccess', () => {
  it('saves a valid role for a user', () => {
    fs.existsSync.mockReturnValue(true);
    const result = envAccess.grantAccess('myVault', 'alice', 'editor');
    expect(result).toEqual({ user: 'alice', role: 'editor', vault: 'myVault' });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('throws on invalid role', () => {
    expect(() => envAccess.grantAccess('myVault', 'alice', 'superadmin')).toThrow('Invalid role');
  });
});

describe('revokeAccess', () => {
  it('removes a user from access rules', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ bob: 'viewer' }));
    envAccess.revokeAccess('myVault', 'bob');
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written).not.toHaveProperty('bob');
  });

  it('throws if user has no existing rules', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({}));
    expect(() => envAccess.revokeAccess('myVault', 'unknown')).toThrow("User 'unknown' has no access rules");
  });
});

describe('getRole / canRead / canWrite', () => {
  beforeEach(() => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ alice: 'owner', bob: 'viewer', carol: 'editor' }));
  });

  it('returns the correct role', () => {
    expect(envAccess.getRole('vault', 'alice')).toBe('owner');
    expect(envAccess.getRole('vault', 'nobody')).toBeNull();
  });

  it('canRead returns true for any valid role', () => {
    expect(envAccess.canRead('vault', 'bob')).toBe(true);
    expect(envAccess.canRead('vault', 'nobody')).toBe(false);
  });

  it('canWrite returns true only for owner and editor', () => {
    expect(envAccess.canWrite('vault', 'alice')).toBe(true);
    expect(envAccess.canWrite('vault', 'carol')).toBe(true);
    expect(envAccess.canWrite('vault', 'bob')).toBe(false);
  });
});

describe('listAccess', () => {
  it('returns all access rules for a vault', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ alice: 'owner', bob: 'viewer' }));
    const rules = envAccess.listAccess('myVault');
    expect(rules).toEqual({ alice: 'owner', bob: 'viewer' });
  });
});
