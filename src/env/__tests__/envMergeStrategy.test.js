const {
  validateStrategy,
  mergeWithStrategy,
  listStrategies,
} = require('../envMergeStrategy');

describe('validateStrategy', () => {
  it('accepts valid strategies', () => {
    expect(() => validateStrategy('overwrite')).not.toThrow();
    expect(() => validateStrategy('preserve')).not.toThrow();
    expect(() => validateStrategy('error-on-conflict')).not.toThrow();
  });

  it('throws for unknown strategy', () => {
    expect(() => validateStrategy('magic')).toThrow(/Unknown merge strategy/);
  });
});

describe('mergeWithStrategy – overwrite', () => {
  const base = { A: '1', B: '2' };
  const incoming = { B: '99', C: '3' };

  it('overwrites conflicting keys', () => {
    const { merged } = mergeWithStrategy(base, incoming, 'overwrite');
    expect(merged.B).toBe('99');
  });

  it('adds new keys from incoming', () => {
    const { merged } = mergeWithStrategy(base, incoming, 'overwrite');
    expect(merged.C).toBe('3');
  });

  it('reports conflicting keys', () => {
    const { conflicts } = mergeWithStrategy(base, incoming, 'overwrite');
    expect(conflicts).toContain('B');
    expect(conflicts).not.toContain('A');
    expect(conflicts).not.toContain('C');
  });
});

describe('mergeWithStrategy – preserve', () => {
  const base = { A: '1', B: '2' };
  const incoming = { B: '99', C: '3' };

  it('keeps base value on conflict', () => {
    const { merged } = mergeWithStrategy(base, incoming, 'preserve');
    expect(merged.B).toBe('2');
  });

  it('still adds non-conflicting keys', () => {
    const { merged } = mergeWithStrategy(base, incoming, 'preserve');
    expect(merged.C).toBe('3');
  });

  it('reports conflicts', () => {
    const { conflicts } = mergeWithStrategy(base, incoming, 'preserve');
    expect(conflicts).toContain('B');
  });
});

describe('mergeWithStrategy – error-on-conflict', () => {
  it('throws when a conflict is detected', () => {
    expect(() =>
      mergeWithStrategy({ A: '1' }, { A: '2' }, 'error-on-conflict')
    ).toThrow(/Merge conflict on key "A"/);
  });

  it('does not throw when values are identical', () => {
    expect(() =>
      mergeWithStrategy({ A: '1' }, { A: '1' }, 'error-on-conflict')
    ).not.toThrow();
  });

  it('does not throw when there are no shared keys', () => {
    const { merged } = mergeWithStrategy({ A: '1' }, { B: '2' }, 'error-on-conflict');
    expect(merged).toEqual({ A: '1', B: '2' });
  });
});

describe('listStrategies', () => {
  it('returns all supported strategies', () => {
    const strategies = listStrategies();
    expect(strategies).toContain('overwrite');
    expect(strategies).toContain('preserve');
    expect(strategies).toContain('error-on-conflict');
  });

  it('returns a copy, not the internal array', () => {
    const s1 = listStrategies();
    const s2 = listStrategies();
    expect(s1).not.toBe(s2);
  });
});
