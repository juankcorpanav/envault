const {
  applyRemap,
  invertRemap,
  loadRemap,
  saveRemap,
  listRemaps,
  deleteRemap,
  remapEnvFile,
} = require('../envRemapping');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('applyRemap', () => {
  const env = { OLD_KEY: 'val1', KEEP: 'val2', ANOTHER: 'val3' };
  const mapping = { OLD_KEY: 'NEW_KEY', ANOTHER: 'RENAMED' };

  it('renames keys according to mapping', () => {
    const result = applyRemap(env, mapping);
    expect(result.NEW_KEY).toBe('val1');
    expect(result.RENAMED).toBe('val3');
    expect(result.KEEP).toBe('val2');
    expect(result.OLD_KEY).toBeUndefined();
  });

  it('drops unmapped keys when dropUnmapped is true', () => {
    const result = applyRemap(env, mapping, { dropUnmapped: true });
    expect(result.NEW_KEY).toBe('val1');
    expect(result.RENAMED).toBe('val3');
    expect(result.KEEP).toBeUndefined();
  });

  it('returns empty object for empty env', () => {
    expect(applyRemap({}, mapping)).toEqual({});
  });
});

describe('invertRemap', () => {
  it('inverts a mapping', () => {
    const mapping = { A: 'B', C: 'D' };
    expect(invertRemap(mapping)).toEqual({ B: 'A', D: 'C' });
  });

  it('returns empty object for empty mapping', () => {
    expect(invertRemap({})).toEqual({});
  });
});

describe('saveRemap / loadRemap / listRemaps / deleteRemap', () => {
  const name = `test_remap_${Date.now()}`;
  const mapping = { FOO: 'BAR' };

  afterAll(() => {
    deleteRemap(name);
  });

  it('saves and loads a remap profile', () => {
    saveRemap(name, mapping);
    expect(loadRemap(name)).toEqual(mapping);
  });

  it('lists saved profiles', () => {
    expect(listRemaps()).toContain(name);
  });

  it('returns empty object for missing profile', () => {
    expect(loadRemap('nonexistent_profile_xyz')).toEqual({});
  });

  it('deletes a profile', () => {
    saveRemap(name, mapping);
    deleteRemap(name);
    expect(loadRemap(name)).toEqual({});
  });
});

describe('remapEnvFile', () => {
  let tmpFile;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `test_${Date.now()}.env`);
    fs.writeFileSync(tmpFile, 'OLD_KEY=hello\nKEEP=world\n');
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('remaps keys from a file', () => {
    const result = remapEnvFile(tmpFile, { OLD_KEY: 'NEW_KEY' });
    expect(result.NEW_KEY).toBe('hello');
    expect(result.KEEP).toBe('world');
  });

  it('drops unmapped keys when option set', () => {
    const result = remapEnvFile(tmpFile, { OLD_KEY: 'NEW_KEY' }, { dropUnmapped: true });
    expect(result.NEW_KEY).toBe('hello');
    expect(result.KEEP).toBeUndefined();
  });
});
