/**
 * backfillCommands.js
 * CLI commands for env backfill operations.
 */

const { backfillFromProfile, backfillFromTemplate } = require('./envBackfill');

/**
 * Register backfill commands onto a commander program.
 * @param {import('commander').Command} program
 */
function registerBackfillCommands(program) {
  const backfill = program
    .command('backfill')
    .description('Backfill missing keys into a vault');

  backfill
    .command('from-profile <vaultPath> <profileName>')
    .description('Backfill vault with missing keys from a named profile')
    .option('--dry-run', 'Preview changes without writing', false)
    .action(async (vaultPath, profileName, opts) => {
      try {
        const { added, skipped } = await backfillFromProfile(vaultPath, profileName, {
          dryRun: opts.dryRun,
        });
        const addedKeys = Object.keys(added);
        if (addedKeys.length === 0) {
          console.log('No missing keys found. Vault is up to date.');
        } else {
          console.log(`${opts.dryRun ? '[DRY RUN] Would add' : 'Added'} ${addedKeys.length} key(s): ${addedKeys.join(', ')}`);
        }
        if (skipped.length > 0) {
          console.log(`Skipped ${skipped.length} existing key(s).`);
        }
      } catch (err) {
        console.error('Backfill from profile failed:', err.message);
        process.exitCode = 1;
      }
    });

  backfill
    .command('from-template <vaultPath> <templatePath>')
    .description('Backfill vault with default values from a template file')
    .option('--dry-run', 'Preview changes without writing', false)
    .action(async (vaultPath, templatePath, opts) => {
      try {
        const { added, skipped } = await backfillFromTemplate(vaultPath, templatePath, {
          dryRun: opts.dryRun,
        });
        const addedKeys = Object.keys(added);
        if (addedKeys.length === 0) {
          console.log('No defaults to backfill. Vault is up to date.');
        } else {
          console.log(`${opts.dryRun ? '[DRY RUN] Would add' : 'Added'} ${addedKeys.length} key(s): ${addedKeys.join(', ')}`);
        }
        if (skipped.length > 0) {
          console.log(`Skipped ${skipped.length} existing key(s).`);
        }
      } catch (err) {
        console.error('Backfill from template failed:', err.message);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerBackfillCommands };
