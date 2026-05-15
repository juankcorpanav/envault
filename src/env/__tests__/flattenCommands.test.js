const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { registerFlattenCommands } = require('../flattenCommands');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerFlattenCommands(program);
  return program;
}

describe('flatten command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-flatten-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('flattens a JSON file into a .env file', () => {
    const jsonFile = path.join(tmpDir, 'input.json');
    const outFile = path.join(tmpDir, 'out.env');
    fs.writeFileSync(jsonFile, JSON.stringify({ db: { host: 'localhost', port: 5432 } }));

    const program = buildProgram();
    program.parse(['flatten', jsonFile, outFile], { from: 'user' });

    const content = fs.readFileSync(outFile, 'utf8');
    expect(content).toMatch(/DB_HOST=localhost/);
    expect(content).toMatch(/DB_PORT=5432/);
  });

  it('exits with error for missing JSON file', () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      program.parse(['flatten', '/nonexistent.json', '/out.env'], { from: 'user' })
    ).toThrow('exit');
    mockExit.mockRestore();
  });

  it('exits with error for invalid JSON', () => {
    const jsonFile = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(jsonFile, 'not json');
    const outFile = path.join(tmpDir, 'out.env');
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      program.parse(['flatten', jsonFile, outFile], { from: 'user' })
    ).toThrow('exit');
    mockExit.mockRestore();
  });
});

describe('expand command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-expand-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('expands a .env file into a JSON file', () => {
    const envFile = path.join(tmpDir, 'input.env');
    const outFile = path.join(tmpDir, 'out.json');
    fs.writeFileSync(envFile, 'DB_HOST=localhost\nDB_PORT=5432\n');

    const program = buildProgram();
    program.parse(['expand', envFile, outFile], { from: 'user' });

    const result = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    expect(result).toMatchObject({ DB: { HOST: 'localhost', PORT: '5432' } });
  });

  it('exits with error for missing env file', () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      program.parse(['expand', '/nonexistent.env', '/out.json'], { from: 'user' })
    ).toThrow('exit');
    mockExit.mockRestore();
  });
});
