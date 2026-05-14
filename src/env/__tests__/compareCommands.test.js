const { Command } = require('commander');
const { registerCompareCommands } = require('../compareCommands');
const envCompare = require('../envCompare');

jest.mock('../envCompare');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCompareCommands(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe('compare profiles command', () => {
  it('prints summary when profiles differ', () => {
    envCompare.compareProfiles.mockReturnValue({ diff: {}, summary: '~ KEY1' });
    buildProgram().parse(['node', 'cli', 'compare', 'profiles', 'dev', 'prod']);
    expect(envCompare.compareProfiles).toHaveBeenCalledWith('dev', 'prod');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('dev'));
    expect(console.log).toHaveBeenCalledWith('~ KEY1');
  });

  it('prints JSON when --json flag is used', () => {
    const diff = { added: { X: '1' } };
    envCompare.compareProfiles.mockReturnValue({ diff, summary: '' });
    buildProgram().parse(['node', 'cli', 'compare', 'profiles', 'dev', 'prod', '--json']);
    expect(console.log).toHaveBeenCalledWith(JSON.stringify(diff, null, 2));
  });

  it('prints no differences when summary is empty', () => {
    envCompare.compareProfiles.mockReturnValue({ diff: {}, summary: '' });
    buildProgram().parse(['node', 'cli', 'compare', 'profiles', 'a', 'b']);
    expect(console.log).toHaveBeenCalledWith('(no differences)');
  });

  it('handles errors gracefully', () => {
    envCompare.compareProfiles.mockImplementation(() => { throw new Error('not found'); });
    buildProgram().parse(['node', 'cli', 'compare', 'profiles', 'x', 'y']);
    expect(console.error).toHaveBeenCalledWith('Error: not found');
  });
});

describe('compare vaults command', () => {
  it('diffs two vault paths', () => {
    envCompare.compareVaults.mockReturnValue({ diff: {}, summary: '+ NEW' });
    buildProgram().parse(['node', 'cli', 'compare', 'vaults', '/a/.env', '/b/.env']);
    expect(envCompare.compareVaults).toHaveBeenCalledWith('/a/.env', '/b/.env');
    expect(console.log).toHaveBeenCalledWith('+ NEW');
  });
});

describe('compare profile-vault command', () => {
  it('diffs profile against vault', () => {
    envCompare.compareProfileToVault.mockReturnValue({ diff: {}, summary: '- GONE' });
    buildProgram().parse(['node', 'cli', 'compare', 'profile-vault', 'staging', '/vault/.env']);
    expect(envCompare.compareProfileToVault).toHaveBeenCalledWith('staging', '/vault/.env');
    expect(console.log).toHaveBeenCalledWith('- GONE');
  });
});
