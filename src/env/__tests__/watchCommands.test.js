const { Command } = require('commander');
const { registerWatchCommands } = require('../watchCommands');
const envWatch = require('../envWatch');

jest.mock('../envWatch');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerWatchCommands(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('watch start calls watchEnvFile with resolved path', () => {
  envWatch.watchEnvFile.mockImplementation(() => ({}));
  const program = buildProgram();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'watch', 'start', 'myvault', '/tmp/.env']);
  expect(envWatch.watchEnvFile).toHaveBeenCalledWith(
    'myvault',
    expect.stringContaining('.env'),
    expect.any(Function)
  );
  consoleSpy.mockRestore();
});

test('watch start prints error if watchEnvFile throws', () => {
  envWatch.watchEnvFile.mockImplementation(() => { throw new Error('Already watching'); });
  const program = buildProgram();
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  program.parse(['node', 'test', 'watch', 'start', 'myvault', '/tmp/.env']);
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Already watching'));
  consoleSpy.mockRestore();
});

test('watch stop calls unwatchEnvFile and logs success', () => {
  envWatch.unwatchEnvFile.mockReturnValue(true);
  const program = buildProgram();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'watch', 'stop', 'myvault']);
  expect(envWatch.unwatchEnvFile).toHaveBeenCalledWith('myvault');
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Stopped watching'));
  consoleSpy.mockRestore();
});

test('watch stop prints error if vault not found', () => {
  envWatch.unwatchEnvFile.mockReturnValue(false);
  const program = buildProgram();
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  program.parse(['node', 'test', 'watch', 'stop', 'ghost']);
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No active watcher'));
  consoleSpy.mockRestore();
});

test('watch list prints watched vaults', () => {
  envWatch.listWatched.mockReturnValue([
    { vaultName: 'v1', filePath: '/tmp/.env' },
  ]);
  const program = buildProgram();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'watch', 'list']);
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('v1'));
  consoleSpy.mockRestore();
});

test('watch list prints message when no watchers', () => {
  envWatch.listWatched.mockReturnValue([]);
  const program = buildProgram();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['node', 'test', 'watch', 'list']);
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No vaults'));
  consoleSpy.mockRestore();
});
