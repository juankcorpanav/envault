const fs = require('fs');
const path = require('path');

const mockDir = path.join(process.cwd(), '.envault', 'lineage');

jest.mock('fs');

let mod;

function freshModule() {
  jest.resetModules();
  mod = require('../envLineage');
}

beforeEach(() => {
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  fs.readFileSync.mockReturnValue(JSON.stringify({}));
  freshModule();
});

test('ensureLineageDir creates directory if missing', () => {
  mod.ensureLineageDir();
  expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('lineage'), { recursive: true });
});

test('loadLineage returns empty object when file missing', () => {
  const result = mod.loadLineage('myapp');
  expect(result).toEqual({});
});

test('loadLineage parses existing file', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ API_KEY: [{ timestamp: 't1', action: 'imported' }] }));
  freshModule();
  const result = mod.loadLineage('myapp');
  expect(result).toHaveProperty('API_KEY');
  expect(result.API_KEY[0].action).toBe('imported');
});

test('recordLineage adds entry with timestamp', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({}));
  freshModule();
  const history = mod.recordLineage('myapp', 'SECRET', { action: 'rotated', by: 'alice' });
  expect(history).toHaveLength(1);
  expect(history[0].action).toBe('rotated');
  expect(history[0].by).toBe('alice');
  expect(history[0].timestamp).toBeDefined();
});

test('getKeyLineage returns empty array for unknown key', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({}));
  freshModule();
  expect(mod.getKeyLineage('myapp', 'MISSING')).toEqual([]);
});

test('clearKeyLineage removes key from lineage', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ DB_PASS: [{ timestamp: 't', action: 'set' }] }));
  freshModule();
  mod.clearKeyLineage('myapp', 'DB_PASS');
  const written = JSON.parse(fs.writeFileSync.mock.calls.at(-1)[1]);
  expect(written).not.toHaveProperty('DB_PASS');
});

test('listTrackedKeys returns all keys', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ A: [], B: [] }));
  freshModule();
  expect(mod.listTrackedKeys('myapp')).toEqual(['A', 'B']);
});

test('formatLineageReport returns no-lineage message when empty', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({}));
  freshModule();
  const report = mod.formatLineageReport('myapp', 'GHOST');
  expect(report).toMatch(/No lineage recorded/);
});

test('formatLineageReport formats entries correctly', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(
    JSON.stringify({ TOKEN: [{ timestamp: '2024-01-01T00:00:00.000Z', action: 'cloned', source: 'prod', by: 'bob' }] })
  );
  freshModule();
  const report = mod.formatLineageReport('myapp', 'TOKEN');
  expect(report).toMatch(/cloned/);
  expect(report).toMatch(/source: prod/);
  expect(report).toMatch(/by bob/);
});
