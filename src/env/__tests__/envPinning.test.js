const fs = require('fs');
const path = require('path');

jest.mock('fs');

const PINS_DIR = path.resolve('.envault', 'pins');

let envPinning;

beforeEach(() => {
  jest.resetModules();
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  fs.readFileSync.mockReturnValue('[]');
  envPinning = require('../envPinning');
});

describe('ensurePinsDir', () => {
  it('creates the pins directory if it does not exist', () => {
    envPinning.ensurePinsDir();
    expect(fs.mkdirSync).toHaveBeenCalledWith(PINS_DIR, { recursive: true });
  });

  it('does not create directory if it already exists', () => {
    fs.existsSync.mockReturnValue(true);
    envPinning.ensurePinsDir();
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
});

describe('pinKey', () => {
  it('pins a key successfully', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('[]');
    const result = envPinning.pinKey('myvault', 'API_KEY');
    expect(result.pinned).toBe(true);
    expect(result.key).toBe('API_KEY');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('returns already pinned message if key is duplicate', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(['API_KEY']));
    const result = envPinning.pinKey('myvault', 'API_KEY');
    expect(result.pinned).toBe(false);
    expect(result.reason).toMatch(/already pinned/i);
  });
});

describe('unpinKey', () => {
  it('unpins a pinned key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(['API_KEY', 'DB_PASS']));
    const result = envPinning.unpinKey('myvault', 'API_KEY');
    expect(result.unpinned).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('returns not pinned message if key is absent', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('[]');
    const result = envPinning.unpinKey('myvault', 'MISSING_KEY');
    expect(result.unpinned).toBe(false);
    expect(result.reason).toMatch(/not pinned/i);
  });
});

describe('isPinned', () => {
  it('returns true for a pinned key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(['SECRET']));
    expect(envPinning.isPinned('myvault', 'SECRET')).toBe(true);
  });

  it('returns false for an unpinned key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('[]');
    expect(envPinning.isPinned('myvault', 'SECRET')).toBe(false);
  });
});

describe('assertNotPinned', () => {
  it('throws if key is pinned', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(['API_KEY']));
    expect(() => envPinning.assertNotPinned('myvault', 'API_KEY')).toThrow(/pinned/);
  });

  it('does not throw if key is not pinned', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('[]');
    expect(() => envPinning.assertNotPinned('myvault', 'SAFE_KEY')).not.toThrow();
  });
});
