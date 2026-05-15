const { resolveValue, resolveEnv, listUnresolved } = require('../envResolve');

describe('resolveValue', () => {
  it('returns plain value unchanged', () => {
    expect(resolveValue('hello', {})).toBe('hello');
  });

  it('resolves a simple reference', () => {
    expect(resolveValue('${FOO}', { FOO: 'bar' })).toBe('bar');
  });

  it('resolves a reference embedded in a string', () => {
    expect(resolveValue('prefix_${NAME}_suffix', { NAME: 'world' })).toBe('prefix_world_suffix');
  });

  it('uses fallback when key is absent', () => {
    expect(resolveValue('${MISSING:-default_val}', {})).toBe('default_val');
  });

  it('ignores fallback when key is present', () => {
    expect(resolveValue('${KEY:-fallback}', { KEY: 'actual' })).toBe('actual');
  });

  it('leaves unresolvable reference as-is', () => {
    expect(resolveValue('${UNKNOWN}', {})).toBe('${UNKNOWN}');
  });

  it('resolves multiple references in one value', () => {
    const ctx = { A: 'foo', B: 'bar' };
    expect(resolveValue('${A}-${B}', ctx)).toBe('foo-bar');
  });
});

describe('resolveEnv', () => {
  it('resolves references between keys in order', () => {
    const parsed = { BASE: '/app', DATA: '${BASE}/data' };
    const result = resolveEnv(parsed);
    expect(result.DATA).toBe('/app/data');
  });

  it('leaves forward references unresolved', () => {
    const parsed = { DATA: '${BASE}/data', BASE: '/app' };
    const result = resolveEnv(parsed);
    // BASE not yet in context when DATA is processed
    expect(result.DATA).toBe('${BASE}/data');
    expect(result.BASE).toBe('/app');
  });

  it('handles env with no references', () => {
    const parsed = { A: 'one', B: 'two' };
    expect(resolveEnv(parsed)).toEqual({ A: 'one', B: 'two' });
  });

  it('resolves chained references', () => {
    const parsed = { HOST: 'localhost', PORT: '5432', DSN: 'pg://${HOST}:${PORT}/db' };
    const result = resolveEnv(parsed);
    expect(result.DSN).toBe('pg://localhost:5432/db');
  });

  it('applies fallback for missing keys', () => {
    const parsed = { URL: '${SCHEME:-https}://example.com' };
    const result = resolveEnv(parsed);
    expect(result.URL).toBe('https://example.com');
  });
});

describe('listUnresolved', () => {
  it('returns empty array when all references resolved', () => {
    const resolved = { A: 'hello', B: 'world' };
    expect(listUnresolved(resolved)).toEqual([]);
  });

  it('detects unresolved reference', () => {
    const resolved = { A: '${MISSING}' };
    const result = listUnresolved(resolved);
    expect(result).toContain('MISSING');
  });

  it('detects multiple distinct unresolved keys', () => {
    const resolved = { A: '${FOO}', B: '${BAR}' };
    const result = listUnresolved(resolved);
    expect(result).toContain('FOO');
    expect(result).toContain('BAR');
  });

  it('does not duplicate the same unresolved key', () => {
    const resolved = { A: '${X}', B: '${X}' };
    const result = listUnresolved(resolved);
    expect(result.filter((k) => k === 'X').length).toBe(1);
  });
});
