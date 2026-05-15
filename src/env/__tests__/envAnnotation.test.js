const fs = require('fs');
const path = require('path');

const ANNOTATIONS_DIR = path.resolve('.envault', 'annotations');

function freshModule() {
  jest.resetModules();
  return require('../envAnnotation');
}

beforeEach(() => {
  jest.resetModules();
  if (fs.existsSync(ANNOTATIONS_DIR)) {
    fs.readdirSync(ANNOTATIONS_DIR).forEach(f =>
      fs.unlinkSync(path.join(ANNOTATIONS_DIR, f))
    );
  }
});

afterAll(() => {
  if (fs.existsSync(ANNOTATIONS_DIR)) {
    fs.readdirSync(ANNOTATIONS_DIR).forEach(f =>
      fs.unlinkSync(path.join(ANNOTATIONS_DIR, f))
    );
  }
});

describe('envAnnotation', () => {
  test('annotateKey stores a note for a key', () => {
    const { annotateKey, getAnnotation } = freshModule();
    const result = annotateKey('myvault', 'API_KEY', 'Primary API key for service X');
    expect(result.note).toBe('Primary API key for service X');
    expect(result.updatedAt).toBeDefined();
    const fetched = getAnnotation('myvault', 'API_KEY');
    expect(fetched.note).toBe('Primary API key for service X');
  });

  test('getAnnotation returns null for unannotated key', () => {
    const { getAnnotation } = freshModule();
    expect(getAnnotation('myvault', 'MISSING_KEY')).toBeNull();
  });

  test('listAnnotations returns all annotations for a vault', () => {
    const { annotateKey, listAnnotations } = freshModule();
    annotateKey('myvault', 'DB_HOST', 'Database hostname');
    annotateKey('myvault', 'DB_PORT', 'Database port');
    const all = listAnnotations('myvault');
    expect(Object.keys(all)).toHaveLength(2);
    expect(all['DB_HOST'].note).toBe('Database hostname');
    expect(all['DB_PORT'].note).toBe('Database port');
  });

  test('removeAnnotation deletes an existing annotation', () => {
    const { annotateKey, removeAnnotation, getAnnotation } = freshModule();
    annotateKey('myvault', 'SECRET', 'Some secret');
    const removed = removeAnnotation('myvault', 'SECRET');
    expect(removed).toBe(true);
    expect(getAnnotation('myvault', 'SECRET')).toBeNull();
  });

  test('removeAnnotation returns false for non-existent key', () => {
    const { removeAnnotation } = freshModule();
    expect(removeAnnotation('myvault', 'NOPE')).toBe(false);
  });

  test('annotateKey throws on invalid key', () => {
    const { annotateKey } = freshModule();
    expect(() => annotateKey('myvault', '', 'note')).toThrow('Invalid key');
    expect(() => annotateKey('myvault', null, 'note')).toThrow('Invalid key');
  });

  test('annotateKey throws on missing note', () => {
    const { annotateKey } = freshModule();
    expect(() => annotateKey('myvault', 'KEY', '')).toThrow('Annotation note must be a non-empty string');
    expect(() => annotateKey('myvault', 'KEY', 123)).toThrow('Annotation note must be a non-empty string');
  });

  test('annotations are isolated per vault', () => {
    const { annotateKey, listAnnotations } = freshModule();
    annotateKey('vault-a', 'FOO', 'note a');
    annotateKey('vault-b', 'BAR', 'note b');
    expect(Object.keys(listAnnotations('vault-a'))).toEqual(['FOO']);
    expect(Object.keys(listAnnotations('vault-b'))).toEqual(['BAR']);
  });

  test('loadAnnotations returns empty object when no file exists', () => {
    const { loadAnnotations } = freshModule();
    expect(loadAnnotations('nonexistent-vault')).toEqual({});
  });
});
