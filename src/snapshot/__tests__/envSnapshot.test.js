const fs = require('fs');
const path = require('path');
const { createSnapshot, listSnapshots, loadSnapshot, deleteSnapshot } = require('../envSnapshot');

const SNAPSHOT_DIR = path.resolve('.envault', 'snapshots');

beforeEach(() => {
  if (fs.existsSync(SNAPSHOT_DIR)) {
    fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.startsWith('test-vault__'))
      .forEach(f => fs.unlinkSync(path.join(SNAPSHOT_DIR, f)));
  }
});

describe('createSnapshot', () => {
  it('creates a snapshot file and returns an id', () => {
    const env = { API_KEY: 'abc123', DB_URL: 'postgres://localhost/db' };
    const id = createSnapshot('test-vault', env);
    expect(id).toMatch(/^test-vault__/);
    const snapPath = path.join(SNAPSHOT_DIR, `${id}.snap`);
    expect(fs.existsSync(snapPath)).toBe(true);
  });

  it('stores the env object in the snapshot', () => {
    const env = { SECRET: 'mysecret' };
    const id = createSnapshot('test-vault', env);
    const data = loadSnapshot(id);
    expect(data.env).toEqual(env);
    expect(data.vaultName).toBe('test-vault');
  });
});

describe('listSnapshots', () => {
  it('returns only snapshots for the given vault', () => {
    createSnapshot('test-vault', { A: '1' });
    createSnapshot('test-vault', { B: '2' });
    createSnapshot('other-vault', { C: '3' });
    const snaps = listSnapshots('test-vault');
    expect(snaps.length).toBeGreaterThanOrEqual(2);
    snaps.forEach(s => expect(s).toMatch(/^test-vault__/));
  });
});

describe('loadSnapshot', () => {
  it('throws if snapshot does not exist', () => {
    expect(() => loadSnapshot('nonexistent__2099-01-01')).toThrow('Snapshot not found');
  });
});

describe('deleteSnapshot', () => {
  it('deletes an existing snapshot', () => {
    const id = createSnapshot('test-vault', { X: 'y' });
    const result = deleteSnapshot(id);
    expect(result).toBe(true);
    expect(() => loadSnapshot(id)).toThrow('Snapshot not found');
  });

  it('throws when deleting a non-existent snapshot', () => {
    expect(() => deleteSnapshot('test-vault__fake')).toThrow('Snapshot not found');
  });
});
