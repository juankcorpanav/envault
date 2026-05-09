const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../../audit/auditLog', () => ({ logAuditEvent: jest.fn() }));

const { registerTemplateCommands } = require('../templateCommands');
const { logAuditEvent } = require('../../audit/auditLog');

const TEMPLATE_CONTENT = `# App port\nPORT=3000\n# Secret\nAPP_SECRET=\n`;
const VALID_ENV = `PORT=8080\nAPP_SECRET=mysecret\n`;
const MISSING_ENV = `PORT=8080\n`;

let tmpDir;
let templateFile;
let validEnvFile;
let missingEnvFile;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tmpl-'));
  templateFile = path.join(tmpDir, '.env.template');
  validEnvFile = path.join(tmpDir, '.env.valid');
  missingEnvFile = path.join(tmpDir, '.env.missing');
  fs.writeFileSync(templateFile, TEMPLATE_CONTENT, 'utf8');
  fs.writeFileSync(validEnvFile, VALID_ENV, 'utf8');
  fs.writeFileSync(missingEnvFile, MISSING_ENV, 'utf8');
  logAuditEvent.mockClear();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTemplateCommands(program);
  return program;
}

describe('template validate command', () => {
  test('validates a correct env file and logs audit event', async () => {
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['template', 'validate', templateFile, validEnvFile], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('valid'));
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'template:validate', valid: true }));
    consoleSpy.mockRestore();
  });

  test('reports missing keys for invalid env file', async () => {
    const program = buildProgram();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await program.parseAsync(['template', 'validate', templateFile, missingEnvFile], { from: 'user' });
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('APP_SECRET'));
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ valid: false }));
    errSpy.mockRestore();
  });
});

describe('template generate command', () => {
  test('generates an env file from template to output path', async () => {
    const outputFile = path.join(tmpDir, '.env.generated');
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['template', 'generate', templateFile, outputFile], { from: 'user' });
    expect(fs.existsSync(outputFile)).toBe(true);
    const content = fs.readFileSync(outputFile, 'utf8');
    expect(content).toContain('PORT=3000');
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'template:generate' }));
    consoleSpy.mockRestore();
  });

  test('writes to stdout when no output file given', async () => {
    const program = buildProgram();
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await program.parseAsync(['template', 'generate', templateFile], { from: 'user' });
    expect(writeSpy).toHaveBeenCalled();
    writeSpy.mockRestore();
  });
});
