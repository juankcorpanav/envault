const { setExpiry, removeExpiry, listExpiry, listExpired } = require('./envExpiry');

function registerExpiryCommands(program) {
  const expiry = program
    .command('expiry')
    .description('Manage key expiry for a vault');

  expiry
    .command('set <vault> <key> <date>')
    .description('Set expiry date (ISO 8601) for a key in a vault')
    .action((vault, key, date) => {
      const expiresAt = new Date(date);
      if (isNaN(expiresAt.getTime())) {
        console.error(`Invalid date: "${date}". Use ISO 8601 format.`);
        process.exit(1);
      }
      setExpiry(vault, key, expiresAt);
      console.log(`Expiry set for "${key}" in vault "${vault}": ${expiresAt.toISOString()}`);
    });

  expiry
    .command('remove <vault> <key>')
    .description('Remove expiry for a key in a vault')
    .action((vault, key) => {
      const removed = removeExpiry(vault, key);
      if (removed) {
        console.log(`Expiry removed for "${key}" in vault "${vault}".`);
      } else {
        console.warn(`No expiry found for "${key}" in vault "${vault}".`);
      }
    });

  expiry
    .command('list <vault>')
    .description('List all key expiry entries for a vault')
    .action((vault) => {
      const entries = listExpiry(vault);
      if (entries.length === 0) {
        console.log(`No expiry entries for vault "${vault}".`);
        return;
      }
      entries.forEach(({ key, expiresAt, expired }) => {
        const status = expired ? '[EXPIRED]' : '[active]';
        console.log(`  ${status} ${key} => ${expiresAt}`);
      });
    });

  expiry
    .command('list-expired <vault>')
    .description('List only expired keys for a vault')
    .action((vault) => {
      const expired = listExpired(vault);
      if (expired.length === 0) {
        console.log(`No expired keys in vault "${vault}".`);
        return;
      }
      expired.forEach(({ key, expiresAt }) => {
        console.log(`  [EXPIRED] ${key} => ${expiresAt}`);
      });
    });
}

module.exports = { registerExpiryCommands };
