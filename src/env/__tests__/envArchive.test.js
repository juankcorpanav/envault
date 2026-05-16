const fs = require('fs');
const path = require('path');
const os = require('os');

let archiveModule;

function freshModule() {
  jest.resetModules();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-archive-'));
  jest.mock('path', () => ({
    ...jest.requireActual('path'),
    resolve: (...args) => {
      if (args[0] === '.envault' && args[1] === 'archives') return path.join(tmpDir, 'archives');
      return jest.requireActual('path').resolve(...args);
    },
  }));
  return require('../envArchive');
}

beforeEach(() => {
  archiveModule = freshModule();
});

aftereAll(() => {
  jest.restoreAllMocks();
});

describe('envArchive', () => {
  test('loadArchive returns empty array for unknown vault', () => {
    const result = archiveModule.loadArchive('nonexistent');
    expect(result).toEqual([]);
  });

  test('archiveEnv stores a serialized snapshot', () => {
    const env = { API_KEY: 'abc123', DEBUG: 'true' };
    const entry = archiveModule.archiveEnv('myVault', env, { reason: 'pre-deploy' });
    expect(entry).toHaveProperty('id');
    expect(entry.id).toMatch(/^arc_/);
    expect(entry).toHaveProperty('archivedAt');
    expect(entry).toHaveProperty('snapshot');
    expect(entry.meta).toEqual({ reason: 'pre-deploy' });
  });

  test('listArchives returns summary without snapshot content', () => {
    archiveModule.archiveEnv('myVault', { FOO: 'bar' });
    archiveModule.archiveEnv('myVault', { BAZ: 'qux' });
    const list = archiveModule.listArchives('myVault');
    expect(list).toHaveLength(2);
    list.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('archivedAt');
      expect(item).not.toHaveProperty('snapshot');
    });
  });

  test('getArchiveEntry returns entry with parsed env', () => {
    const env = { SECRET: 'hunter2' };
    const { id } = archiveModule.archiveEnv('myVault', env);
    const entry = archiveModule.getArchiveEntry('myVault', id);
    expect(entry.env).toEqual(env);
    expect(entry.id).toBe(id);
  });

  test('getArchiveEntry throws for unknown id', () => {
    expect(() => archiveModule.getArchiveEntry('myVault', 'arc_999')).toThrow(
      "Archive entry 'arc_999' not found"
    );
  });

  test('deleteArchiveEntry removes the entry', () => {
    const { id } = archiveModule.archiveEnv('myVault', { X: '1' });
    archiveModule.deleteArchiveEntry('myVault', id);
    expect(archiveModule.listArchives('myVault')).toHaveLength(0);
  });

  test('deleteArchiveEntry throws if entry not found', () => {
    expect(() => archiveModule.deleteArchiveEntry('myVault', 'arc_missing')).toThrow(
      "Archive entry 'arc_missing' not found."
    );
  });

  test('clearArchives removes all entries', () => {
    archiveModule.archiveEnv('myVault', { A: '1' });
    archiveModule.archiveEnv('myVault', { B: '2' });
    archiveModule.clearArchives('myVault');
    expect(archiveModule.listArchives('myVault')).toHaveLength(0);
  });
});
