const fs = require('fs');
const path = require('path');

jest.mock('fs');

const TAGS_DIR = path.resolve('.envault', 'key-tags');

let envTagging;

function freshModule() {
  jest.resetModules();
  envTagging = require('../envTagging');
}

beforeEach(() => {
  fs.existsSync.mockReturnValue(true);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  freshModule();
});

function mockTags(data) {
  fs.readFileSync.mockReturnValue(JSON.stringify(data));
}

describe('loadKeyTags', () => {
  it('returns empty object when file missing', () => {
    fs.existsSync.mockImplementation(p => p === TAGS_DIR);
    expect(envTagging.loadKeyTags('dev')).toEqual({});
  });

  it('parses existing tags file', () => {
    mockTags({ API_KEY: ['secret', 'rotation'] });
    expect(envTagging.loadKeyTags('dev')).toEqual({ API_KEY: ['secret', 'rotation'] });
  });
});

describe('tagKey', () => {
  it('adds a tag to a key', () => {
    mockTags({});
    const result = envTagging.tagKey('dev', 'DB_PASS', 'sensitive');
    expect(result).toContain('sensitive');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('does not duplicate existing tag', () => {
    mockTags({ DB_PASS: ['sensitive'] });
    const result = envTagging.tagKey('dev', 'DB_PASS', 'sensitive');
    expect(result.filter(t => t === 'sensitive').length).toBe(1);
  });

  it('throws if key is missing', () => {
    expect(() => envTagging.tagKey('dev', '', 'x')).toThrow();
  });
});

describe('untagKey', () => {
  it('removes a tag from a key', () => {
    mockTags({ DB_PASS: ['sensitive', 'rotation'] });
    const result = envTagging.untagKey('dev', 'DB_PASS', 'rotation');
    expect(result).not.toContain('rotation');
  });

  it('removes key entry when last tag removed', () => {
    mockTags({ DB_PASS: ['sensitive'] });
    envTagging.untagKey('dev', 'DB_PASS', 'sensitive');
    const written = JSON.parse(fs.writeFileSync.mock.calls.at(-1)[1]);
    expect(written['DB_PASS']).toBeUndefined();
  });

  it('returns empty array for unknown key', () => {
    mockTags({});
    expect(envTagging.untagKey('dev', 'UNKNOWN', 'x')).toEqual([]);
  });
});

describe('getTagsForKey', () => {
  it('returns tags for known key', () => {
    mockTags({ TOKEN: ['auth', 'rotation'] });
    expect(envTagging.getTagsForKey('dev', 'TOKEN')).toEqual(['auth', 'rotation']);
  });

  it('returns empty array for unknown key', () => {
    mockTags({});
    expect(envTagging.getTagsForKey('dev', 'NOPE')).toEqual([]);
  });
});

describe('getKeysByTag', () => {
  it('returns keys matching tag', () => {
    mockTags({ A: ['x'], B: ['x', 'y'], C: ['y'] });
    expect(envTagging.getKeysByTag('dev', 'x')).toEqual(['A', 'B']);
  });

  it('returns empty array when no match', () => {
    mockTags({ A: ['x'] });
    expect(envTagging.getKeysByTag('dev', 'z')).toEqual([]);
  });
});

describe('clearTagsForKey', () => {
  it('removes all tags for a key', () => {
    mockTags({ A: ['x', 'y'], B: ['z'] });
    envTagging.clearTagsForKey('dev', 'A');
    const written = JSON.parse(fs.writeFileSync.mock.calls.at(-1)[1]);
    expect(written['A']).toBeUndefined();
    expect(written['B']).toBeDefined();
  });
});
