const {
  listFormats,
  sortedFormat,
  groupedFormat,
  alignedFormat,
  compactFormat,
  formatEnv,
} = require('../envFormat');

describe('listFormats', () => {
  it('returns all supported format names', () => {
    const formats = listFormats();
    expect(formats).toEqual(expect.arrayContaining(['sorted', 'grouped', 'aligned', 'compact']));
    expect(formats).toHaveLength(4);
  });
});

describe('sortedFormat', () => {
  it('sorts keys alphabetically', () => {
    const env = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const result = sortedFormat(env);
    expect(Object.keys(result)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('returns empty object for empty input', () => {
    expect(sortedFormat({})).toEqual({});
  });
});

describe('groupedFormat', () => {
  it('groups keys by prefix', () => {
    const env = { DB_HOST: 'localhost', DB_PORT: '5432', AWS_KEY: 'abc', APP_NAME: 'envault' };
    const result = groupedFormat(env);
    expect(result.DB).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
    expect(result.AWS).toEqual({ AWS_KEY: 'abc' });
    expect(result.APP).toEqual({ APP_NAME: 'envault' });
  });

  it('places keys without underscore into __UNGROUPED__', () => {
    const env = { PORT: '3000', HOST: 'localhost' };
    const result = groupedFormat(env);
    expect(result.__UNGROUPED__).toEqual({ PORT: '3000', HOST: 'localhost' });
  });

  it('handles empty env', () => {
    expect(groupedFormat({})).toEqual({});
  });
});

describe('alignedFormat', () => {
  it('aligns values to the longest key length', () => {
    const env = { A: '1', LONG_KEY: '2' };
    const result = alignedFormat(env);
    const lines = result.split('\n');
    // Both lines should have = at the same position
    const positions = lines.map(l => l.indexOf('='));
    expect(positions[0]).toBe(positions[1]);
  });

  it('returns empty string for empty env', () => {
    expect(alignedFormat({})).toBe('');
  });
});

describe('compactFormat', () => {
  it('produces standard KEY=VALUE lines', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = compactFormat(env);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('returns empty string for empty env', () => {
    expect(compactFormat({})).toBe('');
  });
});

describe('formatEnv', () => {
  const env = { Z: '1', A: '2' };

  it('applies sorted format', () => {
    const result = formatEnv(env, 'sorted');
    expect(Object.keys(result)[0]).toBe('A');
  });

  it('applies grouped format', () => {
    const result = formatEnv({ DB_HOST: 'x' }, 'grouped');
    expect(result.DB).toBeDefined();
  });

  it('applies aligned format and returns a string', () => {
    const result = formatEnv(env, 'aligned');
    expect(typeof result).toBe('string');
  });

  it('applies compact format and returns a string', () => {
    const result = formatEnv(env, 'compact');
    expect(typeof result).toBe('string');
  });

  it('throws for unknown format', () => {
    expect(() => formatEnv(env, 'unknown')).toThrow(/Unknown format/);
  });
});
