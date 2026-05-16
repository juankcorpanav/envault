/**
 * placeholderCommands.js
 * CLI commands for inspecting and resolving env placeholders.
 */

const { readVault, writeVault } = require('../vault/vaultAccess');
const {
  resolvePlaceholders,
  listUnresolvedPlaceholders,
} = require('./envPlaceholder');

/**
 * Registers placeholder-related commands onto a commander program.
 * @param {import('commander').Command} program
 */
function registerPlaceholderCommands(program) {
  const ph = program.command('placeholder').description('Manage env placeholders');

  ph.command('list <vault>')
    .description('List all keys with unresolved placeholders')
    .action((vault) => {
      const env = readVault(vault);
      const unresolved = listUnresolvedPlaceholders(env);
      if (unresolved.length === 0) {
        console.log('No unresolved placeholders found.');
        return;
      }
      for (const { key, placeholders } of unresolved) {
        console.log(`  ${key}: missing [${placeholders.join(', ')}]`);
      }
    });

  ph.command('resolve <vault>')
    .description('Resolve placeholders in a vault and write back')
    .option('--strict', 'Fail if any placeholder cannot be resolved', false)
    .option('--dry-run', 'Preview resolved values without writing', false)
    .action((vault, opts) => {
      const env = readVault(vault);
      let result;
      try {
        result = resolvePlaceholders(env, { strict: opts.strict });
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }

      if (result.unresolved.length > 0) {
        console.warn(`Warning: unresolved placeholders left in output: ${result.unresolved.join(', ')}`);
      }

      if (opts.dryRun) {
        console.log('Dry-run resolved env:');
        for (const [k, v] of Object.entries(result.resolved)) {
          console.log(`  ${k}=${v}`);
        }
        return;
      }

      writeVault(vault, result.resolved);
      console.log(`Placeholders resolved and written to vault "${vault}".`);
    });
}

module.exports = { registerPlaceholderCommands };
