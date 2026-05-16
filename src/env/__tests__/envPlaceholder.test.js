const {
  extractPlaceholders,
  resolvePlaceholder,
  resolvePlaceholders,
  listUnresolvedPlaceholders,
} = require('../envPlaceholder');

describe('extractPlaceholders', () => {
  it('extracts {{KEY}} style placeholders', () => {
    expect(extractPlaceholders('Hello {{NAME}}')).toEqual(['NAME']);
  });

  it('extracts ${KEY} style placeholders', () => {
    expect(extractPlaceholders('prefix_${HOST}_suffix')).toEqual(['HOST']);
  });

  it('extracts multiple unique placeholders', () => {
    const result = extractPlaceholders('{{A}}-{{B}}-{{A}}');
    expect(result).toEqual(['A', 'B']);
  });

  it('returns empty array for plain strings', () => {
    expect(extractPlaceholders('no placeholders here')).toEqual([]);
  });

  it('returns empty array for non-strings', () => {
    expect(extractPlaceholders(42)).toEqual([]);
  });
});

describe('resolvePlaceholder', () => {
  it('replaces {{KEY}} with env value', () => {
    expect(resolvePlaceholder('Hello {{NAME}}', { NAME: 'World' })).toBe('Hello World');
  });

  it('replaces ${KEY} with env value', () => {
    expect(resolvePlaceholder('host=${HOST}', { HOST: 'localhost' })).toBe('host=localhost');
  });

  it('leaves unresolved placeholders intact in non-strict mode', () => {
    expect(resolvePlaceholder('{{MISSING}}', {})).toBe('{{MISSING}}');
  });

  it('throws in strict mode for unresolved placeholder', () => {
    expect(() => resolvePlaceholder('{{MISSING}}', {}, { strict: true })).toThrow(
      'Unresolved placeholder: MISSING'
    );
  });
});

describe('resolvePlaceholders', () => {
  it('resolves all placeholders across env object', () => {
    const env = { BASE: 'http://localhost', URL: '{{BASE}}/api' };
    const { resolved, unresolved } = resolvePlaceholders(env);
    expect(resolved.URL).toBe('http://localhost/api');
    expect(unresolved).toEqual([]);
  });

  it('reports unresolved keys', () => {
    const env = { URL: '{{MISSING}}/path' };
    const { unresolved } = resolvePlaceholders(env);
    expect(unresolved).toContain('MISSING');
  });

  it('throws in strict mode when placeholder is missing', () => {
    const env = { URL: '{{GHOST}}' };
    expect(() => resolvePlaceholders(env, { strict: true })).toThrow('GHOST');
  });

  it('handles env with no placeholders', () => {
    const env = { FOO: 'bar', BAZ: '123' };
    const { resolved, unresolved } = resolvePlaceholders(env);
    expect(resolved).toEqual(env);
    expect(unresolved).toEqual([]);
  });
});

describe('listUnresolvedPlaceholders', () => {
  it('returns entries with missing placeholder refs', () => {
    const env = { A: '{{B}}', C: 'plain' };
    const result = listUnresolvedPlaceholders(env);
    expect(result).toEqual([{ key: 'A', placeholders: ['B'] }]);
  });

  it('returns empty array when all placeholders are resolvable', () => {
    const env = { A: 'hello', B: '{{A}}' };
    expect(listUnresolvedPlaceholders(env)).toEqual([]);
  });

  it('handles multiple missing placeholders per key', () => {
    const env = { X: '{{Y}}-{{Z}}' };
    const result = listUnresolvedPlaceholders(env);
    expect(result[0].placeholders).toEqual(expect.arrayContaining(['Y', 'Z']));
  });
});
