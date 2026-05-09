const { parseTemplate, validateAgainstTemplate, generateFromTemplate } = require('../envTemplate');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SAMPLE_TEMPLATE = `
# Database connection URL
DB_URL=postgres://localhost:5432/mydb
# API secret key
API_SECRET=
PORT=3000
`.trim();

describe('parseTemplate', () => {
  test('parses keys with defaults and descriptions', () => {
    const entries = parseTemplate(SAMPLE_TEMPLATE);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({ key: 'DB_URL', defaultValue: 'postgres://localhost:5432/mydb', description: 'Database connection URL' });
    expect(entries[1]).toEqual({ key: 'API_SECRET', defaultValue: null, description: 'API secret key' });
    expect(entries[2]).toEqual({ key: 'PORT', defaultValue: '3000', description: null });
  });

  test('handles empty content', () => {
    expect(parseTemplate('')).toEqual([]);
  });

  test('ignores lines without =', () => {
    const entries = parseTemplate('NOEQUALSSIGN\nFOO=bar');
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe('FOO');
  });
});

describe('validateAgainstTemplate', () => {
  const entries = parseTemplate(SAMPLE_TEMPLATE);

  test('returns valid when all required keys present', () => {
    const envObj = { DB_URL: 'x', API_SECRET: 'secret', PORT: '8080' };
    const result = validateAgainstTemplate(entries, envObj);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test('fills in defaults for missing keys with defaults', () => {
    const envObj = { API_SECRET: 'secret' };
    const result = validateAgainstTemplate(entries, envObj);
    expect(result.valid).toBe(true);
    expect(result.withDefaults.DB_URL).toBe('postgres://localhost:5432/mydb');
    expect(result.withDefaults.PORT).toBe('3000');
  });

  test('reports missing keys with no default', () => {
    const envObj = { DB_URL: 'x', PORT: '3000' };
    const result = validateAgainstTemplate(entries, envObj);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('API_SECRET');
  });
});

describe('generateFromTemplate', () => {
  test('generates env content with defaults and comments', () => {
    const entries = parseTemplate(SAMPLE_TEMPLATE);
    const output = generateFromTemplate(entries);
    expect(output).toContain('# Database connection URL');
    expect(output).toContain('DB_URL=postgres://localhost:5432/mydb');
    expect(output).toContain('API_SECRET=');
    expect(output).toContain('PORT=3000');
  });

  test('ends with newline', () => {
    const entries = parseTemplate('KEY=val');
    expect(generateFromTemplate(entries).endsWith('\n')).toBe(true);
  });
});

describe('loadTemplate', () => {
  test('loads and parses a template file from disk', () => {
    const tmpFile = path.join(os.tmpdir(), 'test.env.template');
    fs.writeFileSync(tmpFile, SAMPLE_TEMPLATE, 'utf8');
    const { loadTemplate } = require('../envTemplate');
    const entries = loadTemplate(tmpFile);
    expect(entries).toHaveLength(3);
    fs.unlinkSync(tmpFile);
  });

  test('throws if file does not exist', () => {
    const { loadTemplate } = require('../envTemplate');
    expect(() => loadTemplate('/nonexistent/path.template')).toThrow('Template not found');
  });
});
