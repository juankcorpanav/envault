const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { registerTransformCommands } = require('../transformCommands');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTransformCommands(program);
  return program;
}

let tmpDir;
let envFile;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-transform-'));
  envFile = path.join(tmpDir, '.env');
  fs.writeFileSync(envFile, 'DB_URL=  postgres://localhost  \nSECRET=mysecret\n');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('transform apply', () => {
  it('applies a single rule and overwrites file', () => {
    const program = buildProgram();
    program.parse(['transform', 'apply', envFile, '--rule', 'DB_URL:trim'], { from: 'user' });
    const out = fs.readFileSync(envFile, 'utf8');
    expect(out).toContain('DB_URL=postgres://localhost');
  });

  it('writes to output file when --output provided', () => {
    const outFile = path.join(tmpDir, 'out.env');
    const program = buildProgram();
    program.parse(['transform', 'apply', envFile, '--rule', 'SECRET:mask', '--output', outFile], { from: 'user' });
    const out = fs.readFileSync(outFile, 'utf8');
    expect(out).toMatch(/SECRET=\*+/);
  });

  it('prints to stdout with --dry-run and does not write', () => {
    const original = fs.readFileSync(envFile, 'utf8');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['transform', 'apply', envFile, '--rule', 'SECRET:uppercase', '--dry-run'], { from: 'user' });
    expect(spy).toHaveBeenCalled();
    expect(fs.readFileSync(envFile, 'utf8')).toBe(original);
    spy.mockRestore();
  });

  it('exits with error on invalid rule format', () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      program.parse(['transform', 'apply', envFile, '--rule', 'BADRULE'], { from: 'user' })
    ).toThrow();
    mockExit.mockRestore();
  });
});

describe('transform list', () => {
  it('lists built-in transforms', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    program.parse(['transform', 'list'], { from: 'user' });
    const output = spy.mock.calls.flat().join('\n');
    expect(output).toContain('uppercase');
    expect(output).toContain('mask');
    spy.mockRestore();
  });
});
