const fs = require('fs');
const path = require('path');

jest.mock('fs');

const SCOPES_DIR = path.resolve('.envault', 'scopes');

let envScope;

beforeEach(() => {
  jest.resetModules();
  fs.existsSync.mockReturnValue(true);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  envScope = require('../envScope');
});

function mockScopesFile(data) {
  fs.readFileSync.mockReturnValue(JSON.stringify(data));
}

describe('loadScopes', () => {
  it('returns empty object if file does not exist', () => {
    fs.existsSync.mockImplementation(p => !p.endsWith('.scopes.json'));
    const result = envScope.loadScopes('myapp');
    expect(result).toEqual({});
  });

  it('parses and returns scopes from file', () => {
    mockScopesFile({ frontend: ['API_URL'], backend: ['DB_PASS'] });
    const result = envScope.loadScopes('myapp');
    expect(result.frontend).toContain('API_URL');
  });
});

describe('assignScope', () => {
  it('adds key to scope', () => {
    mockScopesFile({});
    const result = envScope.assignScope('myapp', 'API_KEY', 'frontend');
    expect(result.frontend).toContain('API_KEY');
  });

  it('does not duplicate keys in scope', () => {
    mockScopesFile({ frontend: ['API_KEY'] });
    const result = envScope.assignScope('myapp', 'API_KEY', 'frontend');
    expect(result.frontend.filter(k => k === 'API_KEY').length).toBe(1);
  });
});

describe('removeFromScope', () => {
  it('removes key from scope', () => {
    mockScopesFile({ frontend: ['API_KEY', 'APP_NAME'] });
    const result = envScope.removeFromScope('myapp', 'API_KEY', 'frontend');
    expect(result.frontend).not.toContain('API_KEY');
  });

  it('deletes scope if empty after removal', () => {
    mockScopesFile({ frontend: ['API_KEY'] });
    const result = envScope.removeFromScope('myapp', 'API_KEY', 'frontend');
    expect(result.frontend).toBeUndefined();
  });

  it('returns scopes unchanged if scope does not exist', () => {
    mockScopesFile({ backend: ['DB_URL'] });
    const result = envScope.removeFromScope('myapp', 'API_KEY', 'frontend');
    expect(result.backend).toContain('DB_URL');
  });
});

describe('getKeysInScope', () => {
  it('returns keys for a given scope', () => {
    mockScopesFile({ ci: ['CI_TOKEN', 'BUILD_NUM'] });
    expect(envScope.getKeysInScope('myapp', 'ci')).toEqual(['CI_TOKEN', 'BUILD_NUM']);
  });

  it('returns empty array for unknown scope', () => {
    mockScopesFile({});
    expect(envScope.getKeysInScope('myapp', 'unknown')).toEqual([]);
  });
});

describe('getScopesForKey', () => {
  it('returns all scopes containing the key', () => {
    mockScopesFile({ frontend: ['API_URL'], shared: ['API_URL', 'APP_NAME'] });
    const scopes = envScope.getScopesForKey('myapp', 'API_URL');
    expect(scopes).toContain('frontend');
    expect(scopes).toContain('shared');
  });

  it('returns empty array if key is in no scope', () => {
    mockScopesFile({ frontend: ['OTHER_KEY'] });
    expect(envScope.getScopesForKey('myapp', 'MISSING')).toEqual([]);
  });
});

describe('listScopes', () => {
  it('returns all scope names', () => {
    mockScopesFile({ frontend: [], backend: [], ci: [] });
    expect(envScope.listScopes('myapp')).toEqual(['frontend', 'backend', 'ci']);
  });
});

describe('filterEnvByScope', () => {
  it('returns only keys in the scope', () => {
    mockScopesFile({ frontend: ['API_URL', 'APP_NAME'] });
    const env = { API_URL: 'https://x.com', APP_NAME: 'myapp', DB_PASS: 'secret' };
    const filtered = envScope.filterEnvByScope('myapp', env, 'frontend');
    expect(filtered).toEqual({ API_URL: 'https://x.com', APP_NAME: 'myapp' });
    expect(filtered.DB_PASS).toBeUndefined();
  });
});
