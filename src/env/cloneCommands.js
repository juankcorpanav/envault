const { cloneVault, previewClone } = require('./envClone');

/**
 * Register CLI commands for vault cloning.
 * @param {import('commander').Command} program
 */
function registerCloneCommands(program) {
  const clone = program
    .command('clone')
    .description('Clone keys from one vault to another');

  clone
    .command('run <source> <target>')
    .description('Clone all (or filtered) keys from source vault to target vault')
    .option('--keys <keys>', 'Comma-separated list of keys to clone')
    .option('--prefix <prefix>', 'Only clone keys starting with this prefix')
    .option('--overwrite', 'Overwrite existing keys in the target vault', false)
    .action(async (source, target, opts) => {
      try {
        const options = {
          overwrite: opts.overwrite,
          prefix: opts.prefix,
          keys: opts.keys ? opts.keys.split(',').map((k) => k.trim()) : undefined,
        };
        const result = await cloneVault(source, target, options);
        if (result.cloned.length === 0) {
          console.log('No keys were cloned (all already exist or none matched filter).');
        } else {
          console.log(`Cloned ${result.cloned.length} key(s) from "${source}" to "${target}":`);
          result.cloned.forEach((k) => console.log(`  + ${k}`));
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  clone
    .command('preview <source> <target>')
    .description('Preview what would be cloned without making changes')
    .option('--keys <keys>', 'Comma-separated list of keys to clone')
    .option('--prefix <prefix>', 'Only clone keys starting with this prefix')
    .option('--overwrite', 'Treat all keys as clonable (ignore existing)', false)
    .action(async (source, target, opts) => {
      try {
        const options = {
          overwrite: opts.overwrite,
          prefix: opts.prefix,
          keys: opts.keys ? opts.keys.split(',').map((k) => k.trim()) : undefined,
        };
        const { willClone, willSkip } = await previewClone(source, target, options);
        console.log(`Preview clone from "${source}" to "${target}":`);
        if (willClone.length > 0) {
          console.log(`  Would clone (${willClone.length}):`);
          willClone.forEach((k) => console.log(`    + ${k}`));
        }
        if (willSkip.length > 0) {
          console.log(`  Would skip / already exists (${willSkip.length}):`);
          willSkip.forEach((k) => console.log(`    ~ ${k}`));
        }
        if (willClone.length === 0 && willSkip.length === 0) {
          console.log('  Nothing to clone.');
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerCloneCommands };
