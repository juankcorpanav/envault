const { renameKey, bulkRenameKeys } = require('./envRename');

/**
 * Register CLI commands for key renaming.
 * @param {import('commander').Command} program
 */
function registerRenameCommands(program) {
  const rename = program
    .command('rename')
    .description('Rename keys within a vault');

  rename
    .command('key <vault> <oldKey> <newKey>')
    .description('Rename a single key in a vault')
    .option('--overwrite', 'Overwrite the target key if it already exists', false)
    .action(async (vault, oldKey, newKey, opts) => {
      try {
        const result = await renameKey(vault, oldKey, newKey, { overwrite: opts.overwrite });
        console.log(`Renamed "${result.oldKey}" → "${result.newKey}" in vault "${vault}"`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  rename
    .command('bulk <vault>')
    .description('Bulk rename keys from a JSON mapping (oldKey:newKey)')
    .requiredOption('--mapping <json>', 'JSON object mapping old keys to new keys, e.g. \'{"OLD":"NEW"}\'')
    .option('--overwrite', 'Overwrite target keys if they already exist', false)
    .action(async (vault, opts) => {
      let mapping;
      try {
        mapping = JSON.parse(opts.mapping);
      } catch {
        console.error('Error: --mapping must be valid JSON');
        process.exitCode = 1;
        return;
      }
      try {
        const results = await bulkRenameKeys(vault, mapping, { overwrite: opts.overwrite });
        results.forEach(({ oldKey, newKey }) =>
          console.log(`  "${oldKey}" → "${newKey}"`)
        );
        console.log(`Bulk renamed ${results.length} key(s) in vault "${vault}"`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerRenameCommands };
