const { Command } = require('commander');

function buildProgram(historyMock, vaultMock) {
  jest.resetModules();
  jest.doMock('../envHistory', () => historyMock);
  jest.doMock('../../vault/vaultAccess', () => vaultMock);
  const { registerHistoryCommands } = require('../historyCommands');
  const program = new Command();
  program.exitOverride();
  registerHistoryCommands(program);
  return program;
}

const defaultVaultMock = { readVault: jest.fn(), updateVault: jest.fn(), deleteVaultKey: jest.fn() };

test('history list prints entries', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mock = {
    getHistory: jest.fn().mockReturnValue([{ timestamp: '2024-01-01T00:00:00Z', action: 'set', key: 'API_KEY', user: 'alice', id: 'abc1', oldValue: null, newValue: 'secret' }]),
    recordChange: jest.fn(), clearHistory: jest.fn(), undoLast: jest.fn()
  };
  const program = buildProgram(mock, defaultVaultMock);
  program.parse(['node', 'test', 'history', 'list', 'myVault']);
  expect(mock.getHistory).toHaveBeenCalledWith('myVault', { key: undefined, limit: 20 });
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

test('history list with no entries prints message', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mock = { getHistory: jest.fn().mockReturnValue([]), recordChange: jest.fn(), clearHistory: jest.fn(), undoLast: jest.fn() };
  const program = buildProgram(mock, defaultVaultMock);
  program.parse(['node', 'test', 'history', 'list', 'myVault']);
  expect(spy).toHaveBeenCalledWith('No history found.');
  spy.mockRestore();
});

test('history clear calls clearHistory', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mock = { getHistory: jest.fn(), recordChange: jest.fn(), clearHistory: jest.fn(), undoLast: jest.fn() };
  const program = buildProgram(mock, defaultVaultMock);
  program.parse(['node', 'test', 'history', 'clear', 'myVault']);
  expect(mock.clearHistory).toHaveBeenCalledWith('myVault');
  spy.mockRestore();
});

test('history undo with nothing to undo prints message', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mock = { getHistory: jest.fn(), recordChange: jest.fn(), clearHistory: jest.fn(), undoLast: jest.fn().mockReturnValue(null) };
  const program = buildProgram(mock, defaultVaultMock);
  program.parse(['node', 'test', 'history', 'undo', 'myVault']);
  expect(spy).toHaveBeenCalledWith('Nothing to undo.');
  spy.mockRestore();
});

test('history undo restores deleted key', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const vaultMock = { readVault: jest.fn(), updateVault: jest.fn(), deleteVaultKey: jest.fn() };
  const mock = { getHistory: jest.fn(), recordChange: jest.fn(), clearHistory: jest.fn(), undoLast: jest.fn().mockReturnValue({ action: 'delete', key: 'DB_URL', oldValue: 'pg://localhost' }) };
  const program = buildProgram(mock, vaultMock);
  program.parse(['node', 'test', 'history', 'undo', 'myVault']);
  expect(vaultMock.updateVault).toHaveBeenCalledWith('myVault', 'DB_URL', 'pg://localhost');
  spy.mockRestore();
});
