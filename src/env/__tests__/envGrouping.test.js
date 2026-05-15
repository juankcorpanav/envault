const fs = require('fs');
const path = require('path');

jest.mock('fs');

let envGrouping;

function freshModule() {
  jest.resetModules();
  envGrouping = require('../envGrouping');
}

const MOCK_GROUPS_PATH = path.join(process.cwd(), '.envault', 'groups', 'groups.json');

beforeEach(() => {
  fs.existsSync.mockReturnValue(false);
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
  fs.readFileSync.mockReturnValue('{}');
  freshModule();
});

test('loadGroups returns empty object when file missing', () => {
  fs.existsSync.mockReturnValue(false);
  expect(envGrouping.loadGroups()).toEqual({});
});

test('loadGroups parses existing file', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ DB: ['DB_HOST', 'DB_PORT'] }));
  freshModule();
  expect(envGrouping.loadGroups()).toEqual({ DB: ['DB_HOST', 'DB_PORT'] });
});

test('addKeyToGroup creates group and adds key', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue('{}');
  const result = envGrouping.addKeyToGroup('DB', 'DB_HOST');
  expect(result).toContain('DB_HOST');
  expect(fs.writeFileSync).toHaveBeenCalled();
});

test('addKeyToGroup does not duplicate key', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ DB: ['DB_HOST'] }));
  const result = envGrouping.addKeyToGroup('DB', 'DB_HOST');
  expect(result.filter(k => k === 'DB_HOST').length).toBe(1);
});

test('addKeyToGroup throws on missing args', () => {
  expect(() => envGrouping.addKeyToGroup('', 'KEY')).toThrow();
  expect(() => envGrouping.addKeyToGroup('GRP', '')).toThrow();
});

test('removeKeyFromGroup removes key from group', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ DB: ['DB_HOST', 'DB_PORT'] }));
  envGrouping.removeKeyFromGroup('DB', 'DB_HOST');
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written.DB).toEqual(['DB_PORT']);
});

test('removeKeyFromGroup deletes group when empty', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ DB: ['DB_HOST'] }));
  envGrouping.removeKeyFromGroup('DB', 'DB_HOST');
  const written = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(written.DB).toBeUndefined();
});

test('deleteGroup removes group', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ DB: ['DB_HOST'] }));
  const result = envGrouping.deleteGroup('DB');
  expect(result).toBe(true);
});

test('deleteGroup returns false for nonexistent group', () => {
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue('{}');
  expect(envGrouping.deleteGroup('MISSING')).toBe(false);
});

test('autoGroupByPrefix groups by first underscore segment', () => {
  const env = { DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'test', PLAIN: 'val' };
  const result = envGrouping.autoGroupByPrefix(env);
  expect(result.DB).toEqual(['DB_HOST', 'DB_PORT']);
  expect(result.APP).toEqual(['APP_NAME']);
  expect(result.__ungrouped__).toEqual(['PLAIN']);
});
