const { inferType, inspectEntry, inspectEnv, formatInspectReport } = require('../envInspect');

describe('inferType', () => {
  it('detects boolean', () => {
    expect(inferType('true')).toBe('boolean');
    expect(inferType('false')).toBe('boolean');
    expect(inferType('TRUE')).toBe('boolean');
  });

  it('detects integer', () => {
    expect(inferType('42')).toBe('integer');
    expect(inferType('-7')).toBe('integer');
  });

  it('detects float', () => {
    expect(inferType('3.14')).toBe('float');
  });

  it('detects url', () => {
    expect(inferType('https://example.com')).toBe('url');
    expect(inferType('http://localhost:3000')).toBe('url');
  });

  it('detects empty', () => {
    expect(inferType('')).toBe('empty');
  });

  it('falls back to string', () => {
    expect(inferType('hello world')).toBe('string');
  });
});

describe('inspectEntry', () => {
  it('returns full metadata for a key-value pair', () => {
    const result = inspectEntry('PORT', '8080');
    expect(result.key).toBe('PORT');
    expect(result.value).toBe('8080');
    expect(result.type).toBe('integer');
    expect(result.length).toBe(4);
    expect(result.hasWhitespace).toBe(false);
    expect(result.isQuoted).toBe(false);
  });

  it('detects whitespace in value', () => {
    const result = inspectEntry('NAME', 'hello world');
    expect(result.hasWhitespace).toBe(true);
  });

  it('detects quoted value', () => {
    const result = inspectEntry('MSG', '"hello"');
    expect(result.isQuoted).toBe(true);
  });
});

describe('inspectEnv', () => {
  const parsed = {
    PORT: '3000',
    DEBUG: 'true',
    DB_URL: 'https://db.example.com',
    SECRET_KEY: 'A1b2C3d4E5f6G7h8',
    EMPTY_VAR: '',
    SPACED: 'hello world',
  };

  it('returns entries, stats, and anomalies', () => {
    const report = inspectEnv(parsed);
    expect(report.entries).toHaveLength(6);
    expect(report.stats.total).toBe(6);
    expect(report.stats.empty).toBe(1);
    expect(report.anomalies.length).toBeGreaterThan(0);
  });

  it('counts secrets correctly', () => {
    const report = inspectEnv(parsed);
    expect(report.stats.secrets).toBeGreaterThanOrEqual(1);
  });

  it('throws on invalid input', () => {
    expect(() => inspectEnv(null)).toThrow(TypeError);
    expect(() => inspectEnv('string')).toThrow(TypeError);
  });

  it('reports anomalies for empty and whitespace values', () => {
    const report = inspectEnv(parsed);
    const keys = report.anomalies.map((a) => a.key);
    expect(keys).toContain('EMPTY_VAR');
    expect(keys).toContain('SPACED');
  });
});

describe('formatInspectReport', () => {
  it('returns a readable string report', () => {
    const report = inspectEnv({ PORT: '3000', EMPTY: '' });
    const output = formatInspectReport(report);
    expect(output).toContain('Total keys: 2');
    expect(output).toContain('Empty values: 1');
    expect(output).toContain('Anomalies:');
  });

  it('omits anomalies section when none exist', () => {
    const report = inspectEnv({ PORT: '3000', DEBUG: 'false' });
    const output = formatInspectReport(report);
    expect(output).not.toContain('Anomalies:');
  });
});
