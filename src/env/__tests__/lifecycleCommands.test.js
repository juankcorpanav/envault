const { Command } = require('commander');

jest.mock('../envLifecycle');

const lifecycle = require('../envLifecycle');
const { registerLifecycleCommands } = require('../lifecycleCommands');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLifecycleCommands(program);
  return program;
}

beforeEach(() => jest.clearAllMocks());

describe('lifecycle set', () => {
  it('registers a hook and prints confirmation', () => {
    lifecycle.registerLifecycleHook.mockReturnValue({ onCreate: 'echo hi' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'set', 'DB_URL', 'onCreate', 'echo hi']);
    expect(lifecycle.registerLifecycleHook).toHaveBeenCalledWith('DB_URL', 'onCreate', 'echo hi');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('registered'));
    spy.mockRestore();
  });

  it('prints error and exits on invalid event', () => {
    lifecycle.registerLifecycleHook.mockImplementation(() => { throw new Error('Invalid lifecycle event'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'set', 'X', 'onMagic', 'cmd']);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid lifecycle event'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('lifecycle remove', () => {
  it('removes a hook and prints confirmation', () => {
    lifecycle.removeLifecycleHook.mockImplementation(() => {});
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'remove', 'DB_URL', 'onCreate']);
    expect(lifecycle.removeLifecycleHook).toHaveBeenCalledWith('DB_URL', 'onCreate');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('removed'));
    spy.mockRestore();
  });
});

describe('lifecycle get', () => {
  it('prints hooks for a key', () => {
    lifecycle.getLifecycleHooks.mockReturnValue({ onUpdate: 'notify' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'get', 'API_KEY']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('onUpdate'));
    spy.mockRestore();
  });

  it('prints no hooks message when empty', () => {
    lifecycle.getLifecycleHooks.mockReturnValue({});
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'get', 'MISSING']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No lifecycle hooks'));
    spy.mockRestore();
  });
});

describe('lifecycle list', () => {
  it('prints all hooks', () => {
    lifecycle.listAllLifecycleHooks.mockReturnValue({ TOKEN: { onDelete: 'revoke' } });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('TOKEN'));
    spy.mockRestore();
  });

  it('prints empty message when no hooks', () => {
    lifecycle.listAllLifecycleHooks.mockReturnValue({});
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'list']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No lifecycle hooks'));
    spy.mockRestore();
  });
});

describe('lifecycle trigger', () => {
  it('prints trigger result when hook exists', () => {
    lifecycle.triggerLifecycleHook.mockReturnValue({ key: 'TOKEN', event: 'onDelete', command: 'revoke', context: {}, triggeredAt: '2024-01-01' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'trigger', 'TOKEN', 'onDelete']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('triggered'));
    spy.mockRestore();
  });

  it('prints not found message when no hook', () => {
    lifecycle.triggerLifecycleHook.mockReturnValue(null);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'lifecycle', 'trigger', 'NONE', 'onCreate']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No lifecycle hook found'));
    spy.mockRestore();
  });
});
