const fs = require('fs');
const path = require('path');

jest.mock('fs');

const LINKS_FILE = path.resolve('.envault', 'links', 'links.json');

function freshModule() {
  jest.resetModules();
  return require('../envLinker');
}

beforeEach(() => {
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  fs.readFileSync.mockReturnValue('[]');
});

describe('envLinker', () => {
  test('loadLinks returns [] when file does not exist', () => {
    const { loadLinks } = freshModule();
    expect(loadLinks()).toEqual([]);
  });

  test('loadLinks returns parsed links when file exists', () => {
    fs.existsSync.mockReturnValue(true);
    const data = [{ sourceVault: 'dev', sourceKey: 'DB_URL', targetVault: 'staging', targetKey: 'DB_URL', createdAt: '2024-01-01' }];
    fs.readFileSync.mockReturnValue(JSON.stringify(data));
    const { loadLinks } = freshModule();
    expect(loadLinks()).toEqual(data);
  });

  test('addLink adds a new link and saves', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('[]');
    const { addLink } = freshModule();
    const link = addLink('dev', 'API_KEY', 'staging', 'API_KEY');
    expect(link.sourceVault).toBe('dev');
    expect(link.targetVault).toBe('staging');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('addLink throws if link already exists', () => {
    const existing = [{ sourceVault: 'dev', sourceKey: 'API_KEY', targetVault: 'staging', targetKey: 'API_KEY', createdAt: '' }];
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(existing));
    const { addLink } = freshModule();
    expect(() => addLink('dev', 'API_KEY', 'staging', 'API_KEY')).toThrow('Link already exists');
  });

  test('removeLink removes an existing link', () => {
    const existing = [{ sourceVault: 'dev', sourceKey: 'API_KEY', targetVault: 'staging', targetKey: 'API_KEY', createdAt: '' }];
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(existing));
    const { removeLink } = freshModule();
    expect(() => removeLink('dev', 'API_KEY', 'staging', 'API_KEY')).not.toThrow();
    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved).toHaveLength(0);
  });

  test('removeLink throws if link not found', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('[]');
    const { removeLink } = freshModule();
    expect(() => removeLink('dev', 'MISSING', 'staging', 'MISSING')).toThrow('Link not found');
  });

  test('resolveLinks returns matching links for vault+key', () => {
    const data = [
      { sourceVault: 'dev', sourceKey: 'DB_URL', targetVault: 'staging', targetKey: 'DB_URL', createdAt: '' },
      { sourceVault: 'dev', sourceKey: 'OTHER', targetVault: 'prod', targetKey: 'OTHER', createdAt: '' }
    ];
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(data));
    const { resolveLinks } = freshModule();
    const result = resolveLinks('dev', 'DB_URL');
    expect(result).toHaveLength(1);
    expect(result[0].targetVault).toBe('staging');
  });

  test('clearLinks writes empty array', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('[]');
    const { clearLinks } = freshModule();
    clearLinks();
    const saved = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
    expect(saved).toEqual([]);
  });
});
