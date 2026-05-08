import { scheduleSnapshot, cancelSchedule, listScheduled } from '../snapshot/snapshotScheduler.js';

/**
 * Register snapshot scheduling CLI commands onto a commander program.
 * @param {import('commander').Command} program
 */
export function registerScheduleCommands(program) {
  const schedule = program
    .command('schedule')
    .description('Manage automatic snapshot schedules');

  schedule
    .command('start <vault> <intervalSeconds>')
    .description('Start auto-snapshotting a vault every <intervalSeconds> seconds')
    .action((vault, intervalSeconds) => {
      const ms = parseFloat(intervalSeconds) * 1000;
      if (isNaN(ms) || ms <= 0) {
        console.error('Error: intervalSeconds must be a positive number.');
        process.exitCode = 1;
        return;
      }
      const result = scheduleSnapshot(vault, ms);
      console.log(`Scheduled snapshot for "${result.vaultName}" every ${intervalSeconds}s.`);
    });

  schedule
    .command('stop <vault>')
    .description('Stop auto-snapshotting a vault')
    .action((vault) => {
      const cancelled = cancelSchedule(vault);
      if (cancelled) {
        console.log(`Stopped snapshot schedule for "${vault}".`);
      } else {
        console.warn(`No active schedule found for "${vault}".`);
        process.exitCode = 1;
      }
    });

  schedule
    .command('list')
    .description('List all active snapshot schedules')
    .action(() => {
      const schedules = listScheduled();
      if (schedules.length === 0) {
        console.log('No active snapshot schedules.');
        return;
      }
      console.log('Active snapshot schedules:');
      schedules.forEach(({ vaultName, intervalMs }) => {
        console.log(`  ${vaultName}  —  every ${intervalMs / 1000}s`);
      });
    });
}
