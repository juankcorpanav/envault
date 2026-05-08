const { compareSnapshots, compareSnapshotToCurrent } = require('../snapshotCompare');
const { loadSnapshot } = require('../envSnapshot');

jest.mock('../envSnapshot');

describe('snapshotCompare', () => {
  const vaultName = 'test-vault';

  const snapshotA = { id: 'snap-001', env: { API_KEY: 'abc', DB_URL: 'postgres://old' } };
  const snapshotB = { id: 'snap-002', env: { API_KEY: 'xyz', DB_URL: 'postgres://old', NEW_VAR: '1' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('compareSnapshots', () => {
    it('should return diff between two snapshots', () => {
      loadSnapshot.mockImplementation((vault, id) => {
        if (id === 'snap-001') return snapshotA;
        if (id === 'snap-002') return snapshotB;
        return null;
      });

      const result = compareSnapshots(vaultName, 'snap-001', 'snap-002');

      expect(result).toHaveProperty('diff');
      expect(result).toHaveProperty('formatted');
      expect(result).toHaveProperty('hasChanges');
      expect(result.hasChanges).toBe(true);
    });

    it('should return no changes when snapshots are identical', () => {
      loadSnapshot.mockReturnValue(snapshotA);

      const result = compareSnapshots(vaultName, 'snap-001', 'snap-001');

      expect(result.hasChanges).toBe(false);
    });

    it('should throw if first snapshot is not found', () => {
      loadSnapshot.mockImplementation((vault, id) => {
        if (id === 'snap-002') return snapshotB;
        return null;
      });

      expect(() => compareSnapshots(vaultName, 'snap-missing', 'snap-002'))
        .toThrow('Snapshot not found: snap-missing');
    });

    it('should throw if second snapshot is not found', () => {
      loadSnapshot.mockImplementation((vault, id) => {
        if (id === 'snap-001') return snapshotA;
        return null;
      });

      expect(() => compareSnapshots(vaultName, 'snap-001', 'snap-missing'))
        .toThrow('Snapshot not found: snap-missing');
    });
  });

  describe('compareSnapshotToCurrent', () => {
    it('should compare a snapshot to the current env', () => {
      loadSnapshot.mockReturnValue(snapshotA);

      const currentEnv = { API_KEY: 'new-key', DB_URL: 'postgres://old' };
      const result = compareSnapshotToCurrent(vaultName, 'snap-001', currentEnv);

      expect(result.hasChanges).toBe(true);
      expect(result).toHaveProperty('formatted');
    });

    it('should return no changes if env matches snapshot', () => {
      loadSnapshot.mockReturnValue(snapshotA);

      const result = compareSnapshotToCurrent(vaultName, 'snap-001', snapshotA.env);

      expect(result.hasChanges).toBe(false);
    });

    it('should throw if snapshot is not found', () => {
      loadSnapshot.mockReturnValue(null);

      expect(() => compareSnapshotToCurrent(vaultName, 'snap-missing', {}))
        .toThrow('Snapshot not found: snap-missing');
    });
  });
});
