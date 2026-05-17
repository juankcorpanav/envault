const { findDuplicateValues, dedupEnv, formatDedupReport } = require('../envDedup');

describe('findDuplicateValues', () => {
  it('returns empty array when no duplicates', () => {
    const env = { A: 'foo', B: 'bar', C: 'baz' };
    expect(findDuplicateValues(env)).toEqual([]);
  });

  it('detects a pair of keys sharing the same value', () => {
    const env = { A: 'same', B: 'other', C: 'same' };
    const result = findDuplicateValues(env);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('same');
    expect(result[0].keys).toEqual(expect.arrayContaining(['A', 'C']));
  });

  it('detects multiple duplicate groups', () => {
    const env = { A: 'x', B: 'y', C: 'x', D: 'y', E: 'z' };
    const result = findDuplicateValues(env);
    expect(result).toHaveLength(2);
  });

  it('handles empty env', () => {
    expect(findDuplicateValues({})).toEqual([]);
  });
});

describe('dedupEnv', () => {
  it('removes duplicate-value keys keeping first occurrence', () => {
    const env = { A: 'val', B: 'unique', C: 'val' };
    const { result, removed } = dedupEnv(env);
    expect(result).toEqual({ A: 'val', B: 'unique' });
    expect(removed).toContain('C');
  });

  it('removes duplicate-value keys keeping last when keepFirst=false', () => {
    const env = { A: 'val', B: 'unique', C: 'val' };
    const { result, removed } = dedupEnv(env, { keepFirst: false });
    expect(result).toHaveProperty('C', 'val');
    expect(removed).toContain('A');
  });

  it('returns original env unchanged when no duplicates', () => {
    const env = { X: '1', Y: '2', Z: '3' };
    const { result, removed } = dedupEnv(env);
    expect(result).toEqual(env);
    expect(removed).toHaveLength(0);
  });

  it('handles empty env', () => {
    const { result, removed } = dedupEnv({});
    expect(result).toEqual({});
    expect(removed).toHaveLength(0);
  });

  it('preserves key order for kept keys', () => {
    const env = { A: 'dup', B: 'solo', C: 'dup', D: 'other' };
    const { result } = dedupEnv(env);
    expect(Object.keys(result)).toEqual(['A', 'B', 'D']);
  });
});

describe('formatDedupReport', () => {
  it('returns no-duplicate message when list is empty', () => {
    expect(formatDedupReport([], [])).toBe('No duplicate values found.');
  });

  it('lists duplicate groups and removed keys', () => {
    const duplicates = [{ value: 'shared', keys: ['KEY_A', 'KEY_B'] }];
    const removed = ['KEY_B'];
    const report = formatDedupReport(duplicates, removed);
    expect(report).toContain('shared');
    expect(report).toContain('KEY_A');
    expect(report).toContain('KEY_B');
    expect(report).toContain('Removed keys');
  });

  it('truncates long values in report', () => {
    const longVal = 'a'.repeat(60);
    const duplicates = [{ value: longVal, keys: ['K1', 'K2'] }];
    const report = formatDedupReport(duplicates, []);
    expect(report).toContain('...');
  });
});
