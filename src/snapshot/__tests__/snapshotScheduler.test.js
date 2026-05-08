import { scheduleSnapshot, cancelSchedule, listScheduled } from '../snapshotScheduler.js';
import { createSnapshot } from '../envSnapshot.js';

jest.mock('../envSnapshot.js', () => ({
  createSnapshot: jest.fn().mockResolvedValue({ id: 'snap-mock', createdAt: new Date().toISOString() })
}));

jest.useFakeTimers();

describe('snapshotScheduler', () => {
  beforeEach(() => {
    cancelSchedule('test-vault');
    jest.clearAllMocks();
  });

  afterEach(() => {
    cancelSchedule('test-vault');
  });

  describe('scheduleSnapshot', () => {
    it('should schedule a recurring snapshot for a vault', () => {
      const result = scheduleSnapshot('test-vault', 5000);
      expect(result.vaultName).toBe('test-vault');
      expect(result.intervalMs).toBe(5000);
      expect(result.active).toBe(true);
    });

    it('should trigger createSnapshot on each interval tick', () => {
      scheduleSnapshot('test-vault', 1000);
      jest.advanceTimersByTime(3000);
      expect(createSnapshot).toHaveBeenCalledTimes(3);
      expect(createSnapshot).toHaveBeenCalledWith('test-vault');
    });

    it('should replace existing schedule for same vault', () => {
      scheduleSnapshot('test-vault', 1000);
      scheduleSnapshot('test-vault', 2000);
      const scheduled = listScheduled();
      const entry = scheduled.find(s => s.vaultName === 'test-vault');
      expect(entry.intervalMs).toBe(2000);
    });
  });

  describe('cancelSchedule', () => {
    it('should cancel an active schedule', () => {
      scheduleSnapshot('test-vault', 1000);
      const cancelled = cancelSchedule('test-vault');
      expect(cancelled).toBe(true);
      jest.advanceTimersByTime(3000);
      expect(createSnapshot).not.toHaveBeenCalled();
    });

    it('should return false if no schedule exists for vault', () => {
      const result = cancelSchedule('nonexistent-vault');
      expect(result).toBe(false);
    });
  });

  describe('listScheduled', () => {
    it('should return all active schedules', () => {
      scheduleSnapshot('vault-a', 1000);
      scheduleSnapshot('vault-b', 2000);
      const list = listScheduled();
      const names = list.map(s => s.vaultName);
      expect(names).toContain('vault-a');
      expect(names).toContain('vault-b');
      cancelSchedule('vault-a');
      cancelSchedule('vault-b');
    });

    it('should return empty array when no schedules are active', () => {
      const list = listScheduled();
      const names = list.map(s => s.vaultName);
      expect(names).not.toContain('test-vault');
    });
  });
});
