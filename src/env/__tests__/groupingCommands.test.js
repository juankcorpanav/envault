const { Command } = require('commander');

jest.mock('../envGrouping');
jest.mock('../../secrets/envParser');
jest.mock('fs');

const envGrouping = require('../envGrouping');
const { parseEnv } = require('../../secrets/envParser');
const fs = require('fs');
const { registerGroupingCommands } = require('../groupingCommands');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  return registerGroupingCommands(program);
}

beforeEach(() => {
  jest.clearAllMocks();
  envGrouping.addKeyToGroup.mockReturnValue(['DB_HOST']);
  envGrouping.removeKeyFromGroup.mockReturnValue([]);
  envGrouping.getGroup.mockReturnValue(['DB_HOST', 'DB_PORT']);
  envGrouping.listGroups.mockReturnValue({ DB: ['DB_HOST'], APP: ['APP_NAME'] });
  envGrouping.deleteGroup.mockReturnValue(true);
  envGrouping.autoGroupByPrefix.mockReturnValue({ DB: ['DB_HOST'] });
  parseEnv.mockReturnValue({ DB_HOST: 'localhost' });
  fs.readFileSync.mockReturnValue('DB_HOST=localhost');
});

test('group add calls addKeyToGroup', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'group', 'add', 'DB', 'DB_HOST']);
  expect(envGrouping.addKeyToGroup).toHaveBeenCalledWith('DB', 'DB_HOST');
  spy.mockRestore();
});

test('group remove calls removeKeyFromGroup', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'group', 'remove', 'DB', 'DB_HOST']);
  expect(envGrouping.removeKeyFromGroup).toHaveBeenCalledWith('DB', 'DB_HOST');
  spy.mockRestore();
});

test('group show prints keys', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'group', 'show', 'DB']);
  expect(envGrouping.getGroup).toHaveBeenCalledWith('DB');
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('DB_HOST'));
  spy.mockRestore();
});

test('group show prints empty message for missing group', () => {
  envGrouping.getGroup.mockReturnValue([]);
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'group', 'show', 'MISSING']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('empty or does not exist'));
  spy.mockRestore();
});

test('group list prints all groups', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'group', 'list']);
  expect(envGrouping.listGroups).toHaveBeenCalled();
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('DB'));
  spy.mockRestore();
});

test('group delete calls deleteGroup', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'group', 'delete', 'DB']);
  expect(envGrouping.deleteGroup).toHaveBeenCalledWith('DB');
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('Deleted'));
  spy.mockRestore();
});

test('group auto reads file and groups by prefix', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'group', 'auto', '.env']);
  expect(parseEnv).toHaveBeenCalled();
  expect(envGrouping.autoGroupByPrefix).toHaveBeenCalled();
  spy.mockRestore();
});
