const { diffEnv, formatDiff, hasDiff } = require('../envDiff');

describe('diffEnv', () => {
  const oldEnv = { DB_HOST: 'localhost', DB_PORT: '5432', SECRET: 'abc' };
  const newEnv = { DB_HOST: 'db.prod.com', DB_PORT: '5432', API_KEY: 'xyz123' };

  let diff;
  beforeEach(() => {
    diff = diffEnv(oldEnv, newEnv);
  });

  test('detects added keys', () => {
    expect(diff.added).toEqual({ API_KEY: 'xyz123' });
  });

  test('detects removed keys', () => {
    expect(diff.removed).toEqual({ SECRET: 'abc' });
  });

  test('detects changed keys', () => {
    expect(diff.changed).toEqual({
      DB_HOST: { from: 'localhost', to: 'db.prod.com' }
    });
  });

  test('detects unchanged keys', () => {
    expect(diff.unchanged).toEqual({ DB_PORT: '5432' });
  });

  test('returns empty sections when envs are identical', () => {
    const same = diffEnv(oldEnv, oldEnv);
    expect(same.added).toEqual({});
    expect(same.removed).toEqual({});
    expect(same.changed).toEqual({});
    expect(Object.keys(same.unchanged)).toHaveLength(3);
  });

  test('handles empty old env', () => {
    const d = diffEnv({}, { FOO: 'bar' });
    expect(d.added).toEqual({ FOO: 'bar' });
    expect(d.removed).toEqual({});
  });

  test('handles empty new env', () => {
    const d = diffEnv({ FOO: 'bar' }, {});
    expect(d.removed).toEqual({ FOO: 'bar' });
    expect(d.added).toEqual({});
  });
});

describe('formatDiff', () => {
  test('formats added, removed, and changed keys', () => {
    const diff = diffEnv(
      { OLD_KEY: 'old', SAME: '1' },
      { NEW_KEY: 'new', SAME: '1' }
    );
    const output = formatDiff(diff);
    expect(output).toContain('+ NEW_KEY=new');
    expect(output).toContain('- OLD_KEY=old');
  });

  test('returns "(no changes)" when diff is empty', () => {
    const diff = diffEnv({ A: '1' }, { A: '1' });
    expect(formatDiff(diff)).toBe('(no changes)');
  });

  test('formats changed keys with arrow notation', () => {
    const diff = diffEnv({ HOST: 'localhost' }, { HOST: 'prod.server.com' });
    const output = formatDiff(diff);
    expect(output).toContain('~ HOST: "localhost" → "prod.server.com"');
  });
});

describe('hasDiff', () => {
  test('returns true when there are differences', () => {
    const diff = diffEnv({ A: '1' }, { A: '2' });
    expect(hasDiff(diff)).toBe(true);
  });

  test('returns false when envs are identical', () => {
    const diff = diffEnv({ A: '1' }, { A: '1' });
    expect(hasDiff(diff)).toBe(false);
  });
});
