const fs = require('fs');
const path = require('path');

jest.mock('fs');

let envLifecycle;

function freshModule() {
  jest.resetModules();
  envLifecycle = require('../envLifecycle');
}

beforeEach(() => {
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  fs.readFileSync.mockReturnValue('{}');
  freshModule();
});

aftEreach(() => jest.clearAllMocks());

describe('ensureLifecycleDir', () => {
  it('creates the directory if it does not exist', () => {
    envLifecycle.ensureLifecycleDir();
    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  it('does not create directory if it already exists', () => {
    fs.existsSync.mockReturnValue(true);
    freshModule();
    envLifecycle.ensureLifecycleDir();
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
});

describe('registerLifecycleHook', () => {
  it('registers a valid lifecycle hook', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    const result = envLifecycle.registerLifecycleHook('DB_URL', 'onCreate', 'echo created');
    expect(result).toEqual({ onCreate: 'echo created' });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('throws on invalid event', () => {
    expect(() =>
      envLifecycle.registerLifecycleHook('DB_URL', 'onMagic', 'echo')
    ).toThrow('Invalid lifecycle event');
  });

  it('overwrites an existing hook for same key+event', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ DB_URL: { onCreate: 'old cmd' } }));
    const result = envLifecycle.registerLifecycleHook('DB_URL', 'onCreate', 'new cmd');
    expect(result.onCreate).toBe('new cmd');
  });
});

describe('removeLifecycleHook', () => {
  it('removes a specific event hook from a key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(
      JSON.stringify({ DB_URL: { onCreate: 'echo', onDelete: 'rm' } })
    );
    envLifecycle.removeLifecycleHook('DB_URL', 'onCreate');
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written.DB_URL.onCreate).toBeUndefined();
    expect(written.DB_URL.onDelete).toBe('rm');
  });

  it('removes the key entirely if no hooks remain', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ DB_URL: { onCreate: 'echo' } }));
    envLifecycle.removeLifecycleHook('DB_URL', 'onCreate');
    const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(written.DB_URL).toBeUndefined();
  });
});

describe('getLifecycleHooks', () => {
  it('returns hooks for a key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ API_KEY: { onUpdate: 'notify' } }));
    expect(envLifecycle.getLifecycleHooks('API_KEY')).toEqual({ onUpdate: 'notify' });
  });

  it('returns empty object for unknown key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    expect(envLifecycle.getLifecycleHooks('MISSING')).toEqual({});
  });
});

describe('triggerLifecycleHook', () => {
  it('returns trigger record when hook exists', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ TOKEN: { onDelete: 'revoke' } }));
    const result = envLifecycle.triggerLifecycleHook('TOKEN', 'onDelete', { user: 'admin' });
    expect(result).toMatchObject({ key: 'TOKEN', event: 'onDelete', command: 'revoke' });
    expect(result.triggeredAt).toBeDefined();
  });

  it('returns null when no hook is registered', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{}');
    expect(envLifecycle.triggerLifecycleHook('NONE', 'onCreate')).toBeNull();
  });
});
