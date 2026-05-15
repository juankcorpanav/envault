jest.mock('../envHistory');
jest.mock('../../vault/vaultAccess');
jest.mock('../../audit/auditLog');

const { listRollbackPoints, previewRollback, rollbackVault } = require('../envRollback');
const { loadHistory } = require('../envHistory');
const { readVault, writeVault } = require('../../vault/vaultAccess');
const { logAuditEvent } = require('../../audit/auditLog');

const sampleHistory = [
  { action: 'set', key: 'API_KEY', previous: null, next: 'abc123', timestamp: '2024-01-01T00:00:00.000Z' },
  { action: 'set', key: 'DB_URL', previous: null, next: 'postgres://localhost', timestamp: '2024-01-02T00:00:00.000Z' },
  { action: 'set', key: 'API_KEY', previous: 'abc123', next: 'xyz789', timestamp: '2024-01-03T00:00:00.000Z' },
];

beforeEach(() => {
  jest.clearAllMocks();
  loadHistory.mockReturnValue(sampleHistory);
  readVault.mockReturnValue({ API_KEY: 'xyz789', DB_URL: 'postgres://localhost' });
  writeVault.mockImplementation(() => {});
  logAuditEvent.mockImplementation(() => {});
});

describe('listRollbackPoints', () => {
  it('returns all history entries with index', () => {
    const points = listRollbackPoints('myVault');
    expect(points).toHaveLength(3);
    expect(points[0]).toMatchObject({ index: 0, action: 'set', key: 'API_KEY' });
    expect(points[2]).toMatchObject({ index: 2, action: 'set', key: 'API_KEY', previous: 'abc123' });
  });

  it('calls loadHistory with vault name', () => {
    listRollbackPoints('myVault');
    expect(loadHistory).toHaveBeenCalledWith('myVault');
  });
});

describe('previewRollback', () => {
  it('reconstructs env by undoing history from end to targetIndex', () => {
    // Rolling back to index 2 undoes entry[2]: API_KEY goes from xyz789 back to abc123
    const preview = previewRollback('myVault', 2);
    expect(preview.API_KEY).toBe('abc123');
    expect(preview.DB_URL).toBe('postgres://localhost');
  });

  it('removes a key if previous was null when rolling back a set action', () => {
    // Rolling back to index 0 undoes entries[2] and [1] and [0]
    const preview = previewRollback('myVault', 0);
    expect(preview.API_KEY).toBeUndefined();
    expect(preview.DB_URL).toBeUndefined();
  });

  it('throws on invalid index', () => {
    expect(() => previewRollback('myVault', -1)).toThrow('Invalid rollback index');
    expect(() => previewRollback('myVault', 99)).toThrow('Invalid rollback index');
  });
});

describe('rollbackVault', () => {
  it('writes the rolled-back env to the vault', () => {
    rollbackVault('myVault', 2);
    expect(writeVault).toHaveBeenCalledWith('myVault', expect.objectContaining({ API_KEY: 'abc123' }));
  });

  it('logs an audit event with rollback action', () => {
    rollbackVault('myVault', 2);
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: 'rollback',
      vault: 'myVault',
      targetIndex: 2,
    }));
  });

  it('returns the rolled-back env', () => {
    const result = rollbackVault('myVault', 2);
    expect(result).toMatchObject({ API_KEY: 'abc123' });
  });
});
