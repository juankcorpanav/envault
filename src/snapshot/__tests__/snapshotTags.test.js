const fs = require('fs');
const path = require('path');
const { tagSnapshot, untagSnapshot, resolveTag, listTags, getTagsForSnapshot } = require('../snapshotTags');

const TAGS_FILE = path.join(process.cwd(), '.envault', 'snapshot-tags.json');

beforeEach(() => {
  if (fs.existsSync(TAGS_FILE)) fs.unlinkSync(TAGS_FILE);
});

afterAll(() => {
  if (fs.existsSync(TAGS_FILE)) fs.unlinkSync(TAGS_FILE);
});

describe('tagSnapshot', () => {
  it('should create a tag pointing to a snapshot id', () => {
    const result = tagSnapshot('snap-001', 'stable');
    expect(result).toEqual({ tag: 'stable', snapshotId: 'snap-001' });
    const content = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf8'));
    expect(content['stable']).toBe('snap-001');
  });

  it('should overwrite an existing tag', () => {
    tagSnapshot('snap-001', 'stable');
    tagSnapshot('snap-002', 'stable');
    const content = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf8'));
    expect(content['stable']).toBe('snap-002');
  });

  it('should throw if tag contains invalid characters', () => {
    expect(() => tagSnapshot('snap-001', 'my tag!')).toThrow('alphanumeric');
  });

  it('should throw if snapshotId or tag is missing', () => {
    expect(() => tagSnapshot(null, 'stable')).toThrow('required');
    expect(() => tagSnapshot('snap-001', '')).toThrow('required');
  });
});

describe('untagSnapshot', () => {
  it('should remove an existing tag', () => {
    tagSnapshot('snap-001', 'release');
    const result = untagSnapshot('release');
    expect(result).toEqual({ tag: 'release', snapshotId: 'snap-001' });
    const content = JSON.parse(fs.readFileSync(TAGS_FILE, 'utf8'));
    expect(content['release']).toBeUndefined();
  });

  it('should throw if tag does not exist', () => {
    expect(() => untagSnapshot('nonexistent')).toThrow('not found');
  });
});

describe('resolveTag', () => {
  it('should return the snapshotId for a given tag', () => {
    tagSnapshot('snap-042', 'v1');
    expect(resolveTag('v1')).toBe('snap-042');
  });

  it('should throw for unknown tags', () => {
    expect(() => resolveTag('ghost')).toThrow('not found');
  });
});

describe('listTags', () => {
  it('should return all tags as an array', () => {
    tagSnapshot('snap-001', 'alpha');
    tagSnapshot('snap-002', 'beta');
    const tags = listTags();
    expect(tags).toHaveLength(2);
    expect(tags).toContainEqual({ tag: 'alpha', snapshotId: 'snap-001' });
    expect(tags).toContainEqual({ tag: 'beta', snapshotId: 'snap-002' });
  });

  it('should return empty array when no tags exist', () => {
    expect(listTags()).toEqual([]);
  });
});

describe('getTagsForSnapshot', () => {
  it('should return all tags associated with a snapshot id', () => {
    tagSnapshot('snap-001', 'stable');
    tagSnapshot('snap-001', 'production');
    tagSnapshot('snap-002', 'staging');
    const tags = getTagsForSnapshot('snap-001');
    expect(tags).toContain('stable');
    expect(tags).toContain('production');
    expect(tags).not.toContain('staging');
  });

  it('should return empty array if snapshot has no tags', () => {
    expect(getTagsForSnapshot('snap-999')).toEqual([]);
  });
});
