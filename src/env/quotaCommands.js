const { setQuota, loadQuota, removeQuota, checkQuota } = require('./envQuota');
const { readVault } = require('../vault/vaultAccess');

function registerQuotaCommands(program) {
  const quota = program.command('quota').description('Manage per-vault key/value quotas');

  quota
    .command('set <vault>')
    .description('Set quota limits for a vault')
    .option('--max-keys <n>', 'Maximum number of keys allowed', parseInt)
    .option('--max-value-length <n>', 'Maximum character length per value', parseInt)
    .action((vault, opts) => {
      try {
        const result = setQuota(vault, {
          maxKeys: opts.maxKeys ?? null,
          maxValueLength: opts.maxValueLength ?? null,
        });
        console.log(`Quota set for vault "${vault}":`, JSON.stringify(result, null, 2));
      } catch (err) {
        console.error('Error setting quota:', err.message);
        process.exit(1);
      }
    });

  quota
    .command('get <vault>')
    .description('Show current quota for a vault')
    .action((vault) => {
      const q = loadQuota(vault);
      if (!q) {
        console.log(`No quota configured for vault "${vault}".`);
      } else {
        console.log(JSON.stringify(q, null, 2));
      }
    });

  quota
    .command('remove <vault>')
    .description('Remove quota limits for a vault')
    .action((vault) => {
      removeQuota(vault);
      console.log(`Quota removed for vault "${vault}".`);
    });

  quota
    .command('check <vault>')
    .description('Check if a vault currently violates its quota')
    .action((vault) => {
      try {
        const env = readVault(vault);
        const result = checkQuota(vault, env);
        if (result.passed) {
          console.log(`Vault "${vault}" is within quota.`);
        } else {
          console.warn(`Quota violations for "${vault}":`);
          result.violations.forEach((v) => console.warn(`  - ${v}`));
          process.exit(1);
        }
      } catch (err) {
        console.error('Error checking quota:', err.message);
        process.exit(1);
      }
    });
}

module.exports = { registerQuotaCommands };
