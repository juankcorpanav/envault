const { Command } = require('commander');

jest.mock('../envScope');

const envScope = require('../envScope');
const { registerScopeCommands } = require('../scopeCommands');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerScopeCommands(program);
  return program;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
});

describe('scope assign', () => {
  it('calls assignScope and logs confirmation', () => {
    envScope.assignScope.mockReturnValue({ frontend: ['API_KEY'] });
    buildProgram().parse(['node', 'test', 'scope', 'assign', 'myvault', 'API_KEY', 'frontend']);
    expect(envScope.assignScope).toHaveBeenCalledWith('myvault', 'API_KEY', 'frontend');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
  });
});

describe('scope remove', () => {
  it('calls removeFromScope and logs confirmation', () => {
    envScope.removeFromScope.mockReturnValue({});
    buildProgram().parse(['node', 'test', 'scope', 'remove', 'myvault', 'API_KEY', 'frontend']);
    expect(envScope.removeFromScope).toHaveBeenCalledWith('myvault', 'API_KEY', 'frontend');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('removed'));
  });
});

describe('scope keys', () => {
  it('lists keys in scope', () => {
    envScope.getKeysInScope.mockReturnValue(['API_KEY', 'APP_NAME']);
    buildProgram().parse(['node', 'test', 'scope', 'keys', 'myvault', 'frontend']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
  });

  it('shows message when no keys in scope', () => {
    envScope.getKeysInScope.mockReturnValue([]);
    buildProgram().parse(['node', 'test', 'scope', 'keys', 'myvault', 'empty']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No keys'));
  });
});

describe('scope of', () => {
  it('lists scopes for a key', () => {
    envScope.getScopesForKey.mockReturnValue(['frontend', 'shared']);
    buildProgram().parse(['node', 'test', 'scope', 'of', 'myvault', 'API_KEY']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('frontend'));
  });

  it('shows message when key is in no scope', () => {
    envScope.getScopesForKey.mockReturnValue([]);
    buildProgram().parse(['node', 'test', 'scope', 'of', 'myvault', 'ORPHAN']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('not in any scope'));
  });
});

describe('scope list', () => {
  it('lists all scopes', () => {
    envScope.listScopes.mockReturnValue(['frontend', 'backend']);
    buildProgram().parse(['node', 'test', 'scope', 'list', 'myvault']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('frontend'));
  });

  it('shows message when no scopes defined', () => {
    envScope.listScopes.mockReturnValue([]);
    buildProgram().parse(['node', 'test', 'scope', 'list', 'myvault']);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No scopes'));
  });
});
