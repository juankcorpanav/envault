const fs = require('fs');
const path = require('path');
const os = require('os');

// Point profiles dir to a temp directory for tests
const tmpDir = path.join(os.tmpdir(), `envault-profile-test-${Date.now()}`);
jest.mock('path', () => {
  const actual = jest.requireActual('path');
  return { ...actual, resolve: (...args) => {
    if (args.includes('.envault') || (args[args.length - 1] || '').includes('.envault')) {
      return tmpDir;
    }
    return actual.resolve(...args);
  }};
});

const { saveProfile, loadProfile, listProfiles, deleteProfile, renameProfile } = require('../envProfile');

describe('envProfile', () => {
  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.readdirSync(tmpDir).forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir, { recursive: true });
  });

  describe('saveProfile / loadProfile', () => {
    it('saves and loads a profile correctly', () => {
      saveProfile('development', { DB_HOST: 'localhost', PORT: '3000' });
      const loaded = loadProfile('development');
      expect(loaded).toMatchObject({ DB_HOST: 'localhost', PORT: '3000' });
    });

    it('throws on invalid profile name', () => {
      expect(() => saveProfile('bad name!', {})).toThrow('Invalid profile name');
    });

    it('throws when loading a non-existent profile', () => {
      expect(() => loadProfile('ghost')).toThrow('not found');
    });
  });

  describe('listProfiles', () => {
    it('returns empty array when no profiles exist', () => {
      expect(listProfiles()).toEqual([]);
    });

    it('lists saved profiles', () => {
      saveProfile('staging', { KEY: 'val' });
      saveProfile('production', { KEY: 'prod' });
      const list = listProfiles();
      expect(list).toContain('staging');
      expect(list).toContain('production');
    });
  });

  describe('deleteProfile', () => {
    it('deletes an existing profile', () => {
      saveProfile('temp', { X: '1' });
      deleteProfile('temp');
      expect(listProfiles()).not.toContain('temp');
    });

    it('throws when deleting a non-existent profile', () => {
      expect(() => deleteProfile('nope')).toThrow('not found');
    });
  });

  describe('renameProfile', () => {
    it('renames an existing profile', () => {
      saveProfile('old-name', { A: 'b' });
      const result = renameProfile('old-name', 'new-name');
      expect(result.renamed.to).toBe('new-name');
      expect(listProfiles()).toContain('new-name');
      expect(listProfiles()).not.toContain('old-name');
    });

    it('throws on invalid new name', () => {
      saveProfile('valid', { A: '1' });
      expect(() => renameProfile('valid', 'bad name!')).toThrow('Invalid profile name');
    });

    it('throws when source profile does not exist', () => {
      expect(() => renameProfile('missing', 'other')).toThrow('not found');
    });
  });
});
