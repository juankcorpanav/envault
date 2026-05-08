const { previewRestore, restoreSnapshot } = require('../snapshotRestore');
const { createSnapshot } = require('../envSnapshot');
const { writeVault, readVault } = require('../../vault/vaultAccess');
const { logAuditEvent } = require('../../audit/auditLog');

jest.mock('../../vault/vaultAccess');
jest.mock('../../audit/auditLog');

const VAULT_NAME = 'restore-test-vault';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('previewRestore', () => {
  it('returns diff between current env and snapshot', () => {
    const snapshotEnv = { API_KEY: 'old-key', DB_URL: 'postgres://old' };
    const snapshotId = createSnapshot(VAULT_NAME, snapshotEnv);
    const currentEnv = { API_KEY: 'new-key', DB_URL: 'postgres://old' };

    const preview = previewRestore(snapshotId, currentEnv);
    expect(preview.vaultName).toBe(VAULT_NAME);
    expect(preview.snapshotId).toBe(snapshotId);
    expect(preview.hasDiff).toBe(true);
    expect(preview.diff).toBeDefined();
  });

  it('reports no diff when envs are identical', () => {
    const env = { SAME: 'value' };
    const snapshotId = createSnapshot(VAULT_NAME, env);
    const preview = previewRestore(snapshotId, { ...env });
    expect(preview.hasDiff).toBe(false);
  });
});

describe('restoreSnapshot', () => {
  it('writes vault and logs audit event on successful restore', () => {
    const snapshotEnv = { TOKEN: 'abc' };
    const snapshotId = createSnapshot(VAULT_NAME, snapshotEnv);
    const currentEnv = { TOKEN: 'xyz' };

    const result = restoreSnapshot(snapshotId, currentEnv);
    expect(result.restored).toBe(true);
    expect(writeVault).toHaveBeenCalledWith(VAULT_NAME, snapshotEnv);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'snapshot_restore', vault: VAULT_NAME })
    );
  });

  it('skips restore if no diff detected', () => {
    const env = { NO_CHANGE: 'true' };
    const snapshotId = createSnapshot(VAULT_NAME, env);
    const result = restoreSnapshot(snapshotId, { ...env });
    expect(result.restored).toBe(false);
    expect(writeVault).not.toHaveBeenCalled();
  });
});
