const fs = require('fs');
const path = require('path');
const { setAlias, removeAlias, resolveAlias, listAliases, loadAliases } = require('../envAlias');
const { saveProfile } = require('../envProfile');

jest.mock('fs');

const ALIAS_FILE = path.join(process.cwd(), '.envault', 'aliases.json');
const PROFILES_DIR = path.join(process.cwd(), '.envault', 'profiles');

beforeEach(() => {
  fs.__resetMockFiles && fs.__resetMockFiles();
  jest.clearAllMocks();
});

describe('loadAliases', () => {
  it('returns empty object when alias file does not exist', () => {
    fs.existsSync = jest.fn().mockReturnValue(false);
    expect(loadAliases()).toEqual({});
  });

  it('parses alias file when it exists', () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({ dev: 'development' }));
    expect(loadAliases()).toEqual({ dev: 'development' });
  });

  it('returns empty object on JSON parse error', () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue('not-json');
    expect(loadAliases()).toEqual({});
  });
});

describe('setAlias', () => {
  beforeEach(() => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue('{}');
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();
  });

  it('creates an alias for an existing profile', () => {
    const result = setAlias('dev', 'development');
    expect(result).toEqual({ alias: 'dev', profileName: 'development' });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('throws on invalid alias format', () => {
    expect(() => setAlias('my alias!', 'development')).toThrow('Invalid alias format');
  });

  it('throws when profile does not exist', () => {
    fs.existsSync = jest.fn((p) => !p.includes('development'));
    expect(() => setAlias('dev', 'development')).toThrow('Profile "development" does not exist');
  });

  it('throws on empty alias', () => {
    expect(() => setAlias('', 'development')).toThrow('Alias must be a non-empty string');
  });
});

describe('removeAlias', () => {
  it('removes an existing alias', () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({ dev: 'development' }));
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();
    expect(removeAlias('dev')).toBe('dev');
  });

  it('throws when alias not found', () => {
    fs.existsSync = jest.fn().mockReturnValue(false);
    expect(() => removeAlias('nonexistent')).toThrow('Alias "nonexistent" not found');
  });
});

describe('resolveAlias', () => {
  it('resolves a known alias', () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({ prod: 'production' }));
    expect(resolveAlias('prod')).toBe('production');
  });

  it('returns input unchanged when alias not found', () => {
    fs.existsSync = jest.fn().mockReturnValue(false);
    expect(resolveAlias('staging')).toBe('staging');
  });
});

describe('listAliases', () => {
  it('returns all aliases', () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({ dev: 'development', prod: 'production' }));
    const result = listAliases();
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.dev).toBe('development');
  });
});
