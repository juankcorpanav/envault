const fs = require('fs');
const path = require('path');

jest.mock('fs');

let envQuota;

function freshModule() {
  jest.resetModules();
  envQuota = require('../envQuota');
}

beforeEach(() => {
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  fs.readFileSync.mockImplementation(() => '{}');
  fs.unlinkSync.mockImplementation(() => {});
  freshModule();
});

describe('setQuota', () => {
  test('sets quota with maxKeys and maxValueLength', () => {
    const result = envQuota.setQuota('myVault', { maxKeys: 10, maxValueLength: 100 });
    expect(result.maxKeys).toBe(10);
    expect(result.maxValueLength).toBe(100);
    expect(result.vaultName).toBe('myVault');
    expect(result.updatedAt).toBeDefined();
  });

  test('throws if maxKeys is not a positive integer', () => {
    expect(() => envQuota.setQuota('v', { maxKeys: -1 })).toThrow('maxKeys must be a positive integer');
    expect(() => envQuota.setQuota('v', { maxKeys: 'x' })).toThrow('maxKeys must be a positive integer');
  });

  test('throws if maxValueLength is invalid', () => {
    expect(() => envQuota.setQuota('v', { maxValueLength: 0 })).toThrow('maxValueLength must be a positive integer');
  });

  test('accepts null limits (no restriction)', () => {
    const result = envQuota.setQuota('v', { maxKeys: null, maxValueLength: null });
    expect(result.maxKeys).toBeNull();
    expect(result.maxValueLength).toBeNull();
  });
});

describe('loadQuota', () => {
  test('returns null when no quota file exists', () => {
    fs.existsSync.mockReturnValue(false);
    expect(envQuota.loadQuota('noVault')).toBeNull();
  });

  test('returns parsed quota when file exists', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ maxKeys: 5, maxValueLength: 50 }));
    const q = envQuota.loadQuota('myVault');
    expect(q.maxKeys).toBe(5);
    expect(q.maxValueLength).toBe(50);
  });
});

describe('removeQuota', () => {
  test('removes quota file if it exists', () => {
    fs.existsSync.mockReturnValue(true);
    envQuota.removeQuota('myVault');
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  test('does nothing if quota file does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    envQuota.removeQuota('myVault');
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});

describe('checkQuota', () => {
  test('passes when no quota is set', () => {
    fs.existsSync.mockReturnValue(false);
    const result = envQuota.checkQuota('v', { A: '1', B: '2' });
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('fails when key count exceeds maxKeys', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ maxKeys: 2, maxValueLength: null }));
    const result = envQuota.checkQuota('v', { A: '1', B: '2', C: '3' });
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toMatch(/exceeds limit of 2/);
  });

  test('fails when a value exceeds maxValueLength', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ maxKeys: null, maxValueLength: 5 }));
    const result = envQuota.checkQuota('v', { KEY: 'toolongvalue' });
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toMatch(/KEY/);
  });

  test('passes when env is within all limits', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ maxKeys: 5, maxValueLength: 20 }));
    const result = envQuota.checkQuota('v', { A: 'short', B: 'val' });
    expect(result.passed).toBe(true);
  });
});
