const { Command } = require('commander');
const { registerCastCommands } = require('../castCommands');
const fs = require('fs');
const path = require('path');
const os = require('os');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  return registerCastCommands(program);
}

describe('cast value command', () => {
  it('casts a string value to integer', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'cli', 'cast', 'value', '42', 'integer']);
    expect(spy).toHaveBeenCalledWith('42');
    spy.mockRestore();
  });

  it('casts a value to boolean', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'cli', 'cast', 'value', 'true', 'boolean']);
    expect(spy).toHaveBeenCalledWith('true');
    spy.mockRestore();
  });

  it('exits on invalid cast', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      buildProgram().parse(['node', 'cli', 'cast', 'value', 'bad', 'boolean'])
    ).toThrow('exit');
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('cast file command', () => {
  let tmpDir, envFile;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envcast-'));
    envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'PORT=3000\nDEBUG=true\n', 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('casts env file and prints to stdout', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse([
      'node', 'cli', 'cast', 'file', envFile,
      JSON.stringify({ PORT: 'integer', DEBUG: 'boolean' })
    ]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('writes output to file with --output flag', () => {
    const outFile = path.join(tmpDir, 'out.env');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse([
      'node', 'cli', 'cast', 'file', envFile,
      JSON.stringify({ PORT: 'integer' }),
      '--output', outFile
    ]);
    expect(fs.existsSync(outFile)).toBe(true);
    spy.mockRestore();
  });
});

describe('cast types command', () => {
  it('lists supported types', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'cli', 'cast', 'types']);
    const output = spy.mock.calls[0][0];
    expect(output).toContain('boolean');
    expect(output).toContain('integer');
    spy.mockRestore();
  });
});
