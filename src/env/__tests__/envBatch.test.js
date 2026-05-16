const { listBatchOps, validateOp, applyBatch } = require('../envBatch');

jest.mock('../../vault/vaultAccess');
jest.mock('../envLock');
jest.mock('../envHistory');

const { readVault, writeVault } = require('../../vault/vaultAccess');
const { isLocked } = require('../envLock');
const { recordChange } = require('../envHistory');

describe('listBatchOps', () => {
  it('returns supported operation types', () => {
    const ops = listBatchOps();
    expect(ops).toContain('set');
    expect(ops).toContain('delete');
    expect(ops).toContain('rename');
  });
});

describe('validateOp', () => {
  it('returns invalid for non-object', () => {
    expect(validateOp(null).valid).toBe(false);
    expect(validateOp('set').valid).toBe(false);
  });

  it('returns invalid for unknown type', () => {
    expect(validateOp({ type: 'upsert', key: 'FOO' }).valid).toBe(false);
  });

  it('returns invalid for missing key', () => {
    expect(validateOp({ type: 'set', key: '', value: 'x' }).valid).toBe(false);
  });

  it('returns invalid for set without value', () => {
    expect(validateOp({ type: 'set', key: 'FOO' }).valid).toBe(false);
  });

  it('returns invalid for rename without newKey', () => {
    expect(validateOp({ type: 'rename', key: 'FOO' }).valid).toBe(false);
  });

  it('returns valid for correct set op', () => {
    expect(validateOp({ type: 'set', key: 'FOO', value: 'bar' }).valid).toBe(true);
  });

  it('returns valid for correct delete op', () => {
    expect(validateOp({ type: 'delete', key: 'FOO' }).valid).toBe(true);
  });

  it('returns valid for correct rename op', () => {
    expect(validateOp({ type: 'rename', key: 'FOO', newKey: 'BAR' }).valid).toBe(true);
  });
});

describe('applyBatch', () => {
  beforeEach(() => {
    isLocked.mockReturnValue(false);
    readVault.mockResolvedValue({ FOO: 'foo', BAR: 'bar' });
    writeVault.mockResolvedValue();
    recordChange.mockResolvedValue();
  });

  it('throws if vault is locked', async () => {
    isLocked.mockReturnValue(true);
    await expect(applyBatch('/vault', [{ type: 'set', key: 'X', value: '1' }])).rejects.toThrow('locked');
  });

  it('throws for empty ops array', async () => {
    await expect(applyBatch('/vault', [])).rejects.toThrow('non-empty array');
  });

  it('applies set operation', async () => {
    const { applied, skipped } = await applyBatch('/vault', [{ type: 'set', key: 'NEW', value: '42' }]);
    expect(applied).toBe(1);
    expect(skipped).toBe(0);
    expect(writeVault).toHaveBeenCalledWith('/vault', expect.objectContaining({ NEW: '42', FOO: 'foo' }));
  });

  it('applies delete operation', async () => {
    const { applied } = await applyBatch('/vault', [{ type: 'delete', key: 'FOO' }]);
    expect(applied).toBe(1);
    const written = writeVault.mock.calls[0][1];
    expect(written).not.toHaveProperty('FOO');
  });

  it('skips delete for missing key', async () => {
    const { skipped, results } = await applyBatch('/vault', [{ type: 'delete', key: 'MISSING' }]);
    expect(skipped).toBe(1);
    expect(results[0].reason).toMatch(/not found/i);
  });

  it('applies rename operation', async () => {
    const { applied } = await applyBatch('/vault', [{ type: 'rename', key: 'FOO', newKey: 'FOO2' }]);
    expect(applied).toBe(1);
    const written = writeVault.mock.calls[0][1];
    expect(written).toHaveProperty('FOO2', 'foo');
    expect(written).not.toHaveProperty('FOO');
  });

  it('does not write on dry-run', async () => {
    await applyBatch('/vault', [{ type: 'set', key: 'X', value: '1' }], { dryRun: true });
    expect(writeVault).not.toHaveBeenCalled();
    expect(recordChange).not.toHaveBeenCalled();
  });

  it('skips invalid ops and continues', async () => {
    const ops = [
      { type: 'set', key: 'VALID', value: 'yes' },
      { type: 'set', key: '' }
    ];
    const { applied, skipped } = await applyBatch('/vault', ops);
    expect(applied).toBe(1);
    expect(skipped).toBe(1);
  });
});
