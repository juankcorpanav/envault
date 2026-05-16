const { Command } = require('commander');
const { registerRemapCommands } = require('../remapCommands');
const { saveRemap, deleteRemap, loadRemap } = require('../envRemapping');
const fs = require('fs');
const path = require('path');
const os = require('os');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerRemapCommands(program);
  return program;
}

const profileName = `cmd_test_remap_${Date.now()}`;

afterAll(() => {
  deleteRemap(profileName);
});

describe('remap save', () => {
  it('saves a remap profile', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'remap', 'save', profileName, '{"A":"B"}']);
    expect(loadRemap(profileName)).toEqual({ A: 'B' });
    spy.mockRestore();
  });
});

describe('remap list', () => {
  it('lists remap profiles', () => {
    saveRemap(profileName, { X: 'Y' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'remap', 'list']);
    const calls = spy.mock.calls.map(c => c[0]);
    expect(calls.some(c => c.includes(profileName))).toBe(true);
    spy.mockRestore();
  });
});

describe('remap show', () => {
  it('prints the profile', () => {
    saveRemap(profileName, { FOO: 'BAR' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'remap', 'show', profileName]);
    const output = spy.mock.calls.map(c => c[0]).join('');
    expect(output).toContain('FOO');
    expect(output).toContain('BAR');
    spy.mockRestore();
  });
});

describe('remap apply', () => {
  let tmpFile;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `remap_cmd_${Date.now()}.env`);
    fs.writeFileSync(tmpFile, 'OLD=hello\nKEEP=world\n');
    saveRemap(profileName, { OLD: 'NEW' });
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('applies remap and prints result', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'remap', 'apply', profileName, tmpFile]);
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('NEW=hello');
    spy.mockRestore();
  });
});

describe('remap invert', () => {
  it('prints the inverted mapping', () => {
    saveRemap(profileName, { A: 'B' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'remap', 'invert', profileName]);
    const output = spy.mock.calls.map(c => c[0]).join('');
    expect(output).toContain('"B"');
    expect(output).toContain('"A"');
    spy.mockRestore();
  });
});

describe('remap delete', () => {
  it('deletes a profile', () => {
    saveRemap(profileName, { Z: 'W' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    buildProgram().parse(['node', 'test', 'remap', 'delete', profileName]);
    expect(loadRemap(profileName)).toEqual({});
    spy.mockRestore();
  });
});
