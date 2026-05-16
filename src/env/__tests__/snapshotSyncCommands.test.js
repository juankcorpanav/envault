const { Command } = require('commander');
const { registerSnapshotSyncCommands } = require('../snapshotSyncCommands');

jest.mock('../envSnapshot2Env', () => ({
  promoteEnvToSnapshot: jest.fn(async () => ({ snapshotId: 'snap-001', checksum: 'abc123' })),
  demoteSnapshotToEnv: jest.fn(async () => ({ API_KEY: 'secret' })),
  serializeForTransport: jest.fn(() => 'BASE64PAYLOAD'),
  deserializeFromTransport: jest.fn(() => ({ API_KEY: 'secret' })),
}));

jest.mock('../../vault/vaultAccess', () => ({
  readVault: jest.fn(async () => ({ API_KEY: 'secret' })),
  writeVault: jest.fn(async () => {}),
}));

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSnapshotSyncCommands(program);
  return program;
}

describe('snapshot-sync promote', () => {
  it('calls promoteEnvToSnapshot and logs result', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot-sync', 'promote', 'myVault', 'v1']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('snap-001'));
    spy.mockRestore();
  });
});

describe('snapshot-sync demote', () => {
  it('calls demoteSnapshotToEnv and writeVault', async () => {
    const { writeVault } = require('../../vault/vaultAccess');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot-sync', 'demote', 'myVault', 'snap-001']);
    expect(writeVault).toHaveBeenCalledWith('myVault', { API_KEY: 'secret' });
    spy.mockRestore();
  });
});

describe('snapshot-sync export', () => {
  it('prints base64 payload', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot-sync', 'export', 'myVault']);
    expect(spy).toHaveBeenCalledWith('BASE64PAYLOAD');
    spy.mockRestore();
  });
});

describe('snapshot-sync import', () => {
  it('calls deserializeFromTransport and writeVault', async () => {
    const { writeVault } = require('../../vault/vaultAccess');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'snapshot-sync', 'import', 'myVault', 'BASE64PAYLOAD']);
    expect(writeVault).toHaveBeenCalledWith('myVault', { API_KEY: 'secret' });
    spy.mockRestore();
  });
});
