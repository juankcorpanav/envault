const fs = require('fs');
const path = require('path');

let envDependency;

function freshModule() {
  jest.resetModules();
  envDependency = require('../envDependency');
}

beforeEach(() => {
  jest.mock('fs');
  freshModule();
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  fs.readFileSync.mockReturnValue('{}');
});

afterEach(() => jest.clearAllMocks());

describe('addDependency', () => {
  it('adds a dependency for a key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    const result = envDependency.addDependency('DB_URL', 'DB_HOST');
    expect(result).toContain('DB_HOST');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('does not duplicate an existing dependency', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ DB_URL: ['DB_HOST'] }));
    const result = envDependency.addDependency('DB_URL', 'DB_HOST');
    expect(result.filter(k => k === 'DB_HOST').length).toBe(1);
  });

  it('throws if key equals requiredKey', () => {
    expect(() => envDependency.addDependency('KEY', 'KEY')).toThrow();
  });

  it('throws if key is missing', () => {
    expect(() => envDependency.addDependency('', 'OTHER')).toThrow();
  });

  it('throws if requiredKey is missing', () => {
    expect(() => envDependency.addDependency('KEY', '')).toThrow();
  });
});

describe('removeDependency', () => {
  it('removes an existing dependency', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ DB_URL: ['DB_HOST', 'DB_PORT'] }));
    const result = envDependency.removeDependency('DB_URL', 'DB_HOST');
    expect(result).not.toContain('DB_HOST');
    expect(result).toContain('DB_PORT');
  });

  it('returns empty array for unknown key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    const result = envDependency.removeDependency('UNKNOWN', 'X');
    expect(result).toEqual([]);
  });
});

describe('getDependencies', () => {
  it('returns dependencies for a key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ API_KEY: ['AUTH_URL'] }));
    expect(envDependency.getDependencies('API_KEY')).toContain('AUTH_URL');
  });

  it('returns empty array for key with no dependencies', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    expect(envDependency.getDependencies('MISSING')).toEqual([]);
  });
});

describe('validateDependencies', () => {
  it('returns missing deps when required key is absent', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ DB_URL: ['DB_HOST'] }));
    const result = envDependency.validateDependencies({ DB_URL: 'postgres://...' });
    expect(result).toEqual([{ key: 'DB_URL', missingDep: 'DB_HOST' }]);
  });

  it('returns empty array when all deps are satisfied', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ DB_URL: ['DB_HOST'] }));
    const result = envDependency.validateDependencies({ DB_URL: 'postgres://...', DB_HOST: 'localhost' });
    expect(result).toEqual([]);
  });

  it('returns empty array when env object is empty', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    const result = envDependency.validateDependencies({});
    expect(result).toEqual([]);
  });
});
