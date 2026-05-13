const { Command } = require('commander');
const { registerLockCommands } = require('../lockCommands');

jest.mock('../envLock');
const envLock = require('../envLock');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLockCommands(program);
  return program;
}

beforeEach(() => jest.resetAllMocks());

describe('lock set', () => {
  it('locks a vault and prints confirmation', () => {
    envLock.lockVault.mockReturnValue({ lockedBy: 'alice', lockedAt: '2024-01-01T00:00:00.000Z' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['lock', 'set', 'myapp', '--user', 'alice'], { from: 'user' });
    expect(envLock.lockVault).toHaveBeenCalledWith('myapp', 'alice', '');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('locked by alice'));
    spy.mockRestore();
  });

  it('prints error if vault already locked', () => {
    envLock.lockVault.mockImplementation(() => { throw new Error('already locked by bob'); });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    buildProgram().parse(['lock', 'set', 'myapp'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('already locked by bob'));
    spy.mockRestore();
  });
});

describe('lock release', () => {
  it('unlocks a vault and prints confirmation', () => {
    envLock.unlockVault.mockReturnValue({ unlockedBy: 'alice', unlockedAt: '2024-01-01T01:00:00.000Z' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['lock', 'release', 'myapp', '--user', 'alice'], { from: 'user' });
    expect(envLock.unlockVault).toHaveBeenCalledWith('myapp', 'alice');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('unlocked by alice'));
    spy.mockRestore();
  });
});

describe('lock status', () => {
  it('shows lock info when vault is locked', () => {
    envLock.getLockInfo.mockReturnValue({ lockedBy: 'dave', lockedAt: '2024-03-01T00:00:00.000Z', reason: 'hotfix' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['lock', 'status', 'myapp'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('dave'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('hotfix'));
    spy.mockRestore();
  });

  it('shows not locked message when vault is free', () => {
    envLock.getLockInfo.mockReturnValue(null);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['lock', 'status', 'myapp'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('not locked'));
    spy.mockRestore();
  });
});

describe('lock list', () => {
  it('lists all locked vaults', () => {
    envLock.listLocks.mockReturnValue([
      { vaultName: 'a', lockedBy: 'x', lockedAt: '2024-01-01T00:00:00.000Z' }
    ]);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['lock', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('a'));
    spy.mockRestore();
  });

  it('shows message when no vaults are locked', () => {
    envLock.listLocks.mockReturnValue([]);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['lock', 'list'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No vaults'));
    spy.mockRestore();
  });
});
