const { lockVault, unlockVault, isLocked, getLockInfo, listLocks } = require('./envLock');

function registerLockCommands(program) {
  const lock = program.command('lock').description('Vault lock management');

  lock
    .command('set <vault>')
    .description('Lock a vault to prevent modifications')
    .option('-u, --user <user>', 'User locking the vault', 'cli')
    .option('-r, --reason <reason>', 'Reason for locking', '')
    .action((vault, opts) => {
      try {
        const info = lockVault(vault, opts.user, opts.reason);
        console.log(`Vault "${vault}" locked by ${info.lockedBy} at ${info.lockedAt}`);
      } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
      }
    });

  lock
    .command('release <vault>')
    .description('Unlock a previously locked vault')
    .option('-u, --user <user>', 'User unlocking the vault', 'cli')
    .action((vault, opts) => {
      try {
        const info = unlockVault(vault, opts.user);
        console.log(`Vault "${vault}" unlocked by ${info.unlockedBy} at ${info.unlockedAt}`);
      } catch (err) {
        console.error(err.message);
        process.exitCode = 1;
      }
    });

  lock
    .command('status <vault>')
    .description('Check lock status of a vault')
    .action((vault) => {
      const info = getLockInfo(vault);
      if (info) {
        console.log(`Locked by: ${info.lockedBy}`);
        console.log(`Locked at: ${info.lockedAt}`);
        if (info.reason) console.log(`Reason: ${info.reason}`);
      } else {
        console.log(`Vault "${vault}" is not locked.`);
      }
    });

  lock
    .command('list')
    .description('List all currently locked vaults')
    .action(() => {
      const locks = listLocks();
      if (locks.length === 0) {
        console.log('No vaults are currently locked.');
      } else {
        locks.forEach(l => console.log(`${l.vaultName} — locked by ${l.lockedBy} at ${l.lockedAt}`));
      }
    });
}

module.exports = { registerLockCommands };
