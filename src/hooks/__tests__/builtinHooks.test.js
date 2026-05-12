const {
  auditPostReadHook,
  auditPostWriteHook,
  auditPostRotateHook,
  warnPlaintextSecretsHook,
} = require('../builtinHooks');

jest.mock('../../audit/auditLog', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

const { logAuditEvent } = require('../../audit/auditLog');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('auditPostReadHook', () => {
  it('logs a read audit event', async () => {
    await auditPostReadHook({ vaultName: 'myVault', env: { A: '1', B: '2' } });
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'read', vault: 'myVault', meta: { keys: 2 } })
    );
  });

  it('handles missing env gracefully', async () => {
    await auditPostReadHook({ vaultName: 'myVault' });
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ meta: { keys: 0 } })
    );
  });
});

describe('auditPostWriteHook', () => {
  it('logs a write audit event', async () => {
    await auditPostWriteHook({ vaultName: 'myVault', env: { X: 'val' } });
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'write', vault: 'myVault' })
    );
  });
});

describe('auditPostRotateHook', () => {
  it('logs a rotate audit event with key', async () => {
    await auditPostRotateHook({ vaultName: 'myVault', key: 'DB_PASSWORD' });
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'rotate', meta: { key: 'DB_PASSWORD' } })
    );
  });
});

describe('warnPlaintextSecretsHook', () => {
  it('warns when a sensitive key has a weak value', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await warnPlaintextSecretsHook({ vaultName: 'v', env: { DB_PASSWORD: 'abc123' } });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DB_PASSWORD'));
    warnSpy.mockRestore();
  });

  it('does not warn for strong-looking values', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await warnPlaintextSecretsHook({
      vaultName: 'v',
      env: { DB_PASSWORD: 'a-very-long-and-complex-secret-value-9182736' },
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('does nothing if env is not provided', async () => {
    await expect(warnPlaintextSecretsHook({ vaultName: 'v' })).resolves.not.toThrow();
  });
});
