const fs = require('fs');
const path = require('path');

function freshModule() {
  jest.resetModules();
  return require('../envExpiry');
}

describe('envExpiry', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'envault-expiry-'));
    jest.resetModules();
    jest.doMock('path', () => ({
      ...jest.requireActual('path'),
      resolve: (...args) =>
        args[0] === '.envault' ? path.join(tmpDir, ...args.slice(1)) : path.resolve(...args)
    }));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('setExpiry and loadExpiry persist data', () => {
    const { setExpiry, loadExpiry } = freshModule();
    const future = new Date(Date.now() + 100000);
    setExpiry('myvault', 'API_KEY', future);
    const data = loadExpiry('myvault');
    expect(data['API_KEY']).toBe(future.toISOString());
  });

  test('setExpiry throws on invalid date', () => {
    const { setExpiry } = freshModule();
    expect(() => setExpiry('myvault', 'KEY', new Date('not-a-date'))).toThrow(
      /Invalid expiry date/
    );
  });

  test('removeExpiry removes the key and returns true', () => {
    const { setExpiry, removeExpiry, loadExpiry } = freshModule();
    setExpiry('myvault', 'SECRET', new Date(Date.now() + 50000));
    const result = removeExpiry('myvault', 'SECRET');
    expect(result).toBe(true);
    expect(loadExpiry('myvault')['SECRET']).toBeUndefined();
  });

  test('removeExpiry returns false when key not found', () => {
    const { removeExpiry } = freshModule();
    expect(removeExpiry('myvault', 'NONEXISTENT')).toBe(false);
  });

  test('isExpired returns true for past date', () => {
    const { setExpiry, isExpired } = freshModule();
    setExpiry('myvault', 'OLD_KEY', new Date(Date.now() - 1000));
    expect(isExpired('myvault', 'OLD_KEY')).toBe(true);
  });

  test('isExpired returns false for future date', () => {
    const { setExpiry, isExpired } = freshModule();
    setExpiry('myvault', 'FUTURE_KEY', new Date(Date.now() + 100000));
    expect(isExpired('myvault', 'FUTURE_KEY')).toBe(false);
  });

  test('isExpired returns false when no expiry set', () => {
    const { isExpired } = freshModule();
    expect(isExpired('myvault', 'NO_EXPIRY')).toBe(false);
  });

  test('listExpired returns only expired entries', () => {
    const { setExpiry, listExpired } = freshModule();
    setExpiry('myvault', 'PAST', new Date(Date.now() - 1000));
    setExpiry('myvault', 'FUTURE', new Date(Date.now() + 100000));
    const expired = listExpired('myvault');
    expect(expired).toHaveLength(1);
    expect(expired[0].key).toBe('PAST');
  });

  test('listExpiry returns all entries with expired flag', () => {
    const { setExpiry, listExpiry } = freshModule();
    setExpiry('myvault', 'PAST', new Date(Date.now() - 1000));
    setExpiry('myvault', 'FUTURE', new Date(Date.now() + 100000));
    const all = listExpiry('myvault');
    expect(all).toHaveLength(2);
    const past = all.find((e) => e.key === 'PAST');
    const future = all.find((e) => e.key === 'FUTURE');
    expect(past.expired).toBe(true);
    expect(future.expired).toBe(false);
  });

  test('loadExpiry returns empty object when no file', () => {
    const { loadExpiry } = freshModule();
    expect(loadExpiry('nonexistent')).toEqual({});
  });
});
