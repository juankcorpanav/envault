const { Command } = require('commander');
const { registerSplitCommands } = require('../splitCommands');
const fs = require('fs');
const path = require('path');
const os = require('os');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSplitCommands(program);
  return program;
}

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-split-cmd-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('split command', () => {
  it('splits env file and reports written files', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'DB_HOST=localhost\nDB_PORT=5432\nDEBUG=true\n', 'utf8');
    const outDir = path.join(tmpDir, 'out');

    const logs = [];
    const spy = jest.spyOn(console, 'log').mockImplementation(msg => logs.push(msg));

    const program = buildProgram();
    program.parse(['split', envFile, '-p', 'DB_', '-o', outDir], { from: 'user' });

    expect(logs.some(l => l.includes('file(s)'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, '.env.db'))).toBe(true);

    spy.mockRestore();
  });

  it('reports remainder keys when present', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'DB_HOST=localhost\nUNKNOWN=val\n', 'utf8');
    const outDir = path.join(tmpDir, 'out2');

    const logs = [];
    const spy = jest.spyOn(console, 'log').mockImplementation(msg => logs.push(msg));

    const program = buildProgram();
    program.parse(['split', envFile, '-p', 'DB_', '-o', outDir], { from: 'user' });

    expect(logs.some(l => l.includes('unmatched'))).toBe(true);
    spy.mockRestore();
  });
});

describe('split-preview command', () => {
  it('prints group info without writing files', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'AWS_KEY=abc\nAWS_SECRET=xyz\nAPP_NAME=test\n', 'utf8');

    const logs = [];
    const spy = jest.spyOn(console, 'log').mockImplementation(msg => logs.push(msg));

    const program = buildProgram();
    program.parse(['split-preview', envFile, '-p', 'AWS_'], { from: 'user' });

    expect(logs.some(l => l.includes('AWS'))).toBe(true);
    expect(logs.some(l => l.includes('remainder'))).toBe(true);
    // No files should be written
    expect(fs.readdirSync(tmpDir).filter(f => f !== path.basename(envFile))).toHaveLength(0);

    spy.mockRestore();
  });
});
