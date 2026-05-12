/**
 * aliasCommands.js — CLI commands for managing profile aliases
 */

const { setAlias, removeAlias, resolveAlias, listAliases } = require('./envAlias');

function registerAliasCommands(program) {
  const alias = program.command('alias').description('Manage profile aliases');

  alias
    .command('set <alias> <profile>')
    .description('Create an alias pointing to a profile')
    .action((aliasName, profileName) => {
      try {
        const result = setAlias(aliasName, profileName);
        console.log(`Alias "${result.alias}" -> "${result.profileName}" created.`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  alias
    .command('remove <alias>')
    .description('Remove an existing alias')
    .action((aliasName) => {
      try {
        removeAlias(aliasName);
        console.log(`Alias "${aliasName}" removed.`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  alias
    .command('resolve <alias>')
    .description('Show the profile an alias points to')
    .action((aliasName) => {
      const resolved = resolveAlias(aliasName);
      if (resolved === aliasName) {
        console.log(`"${aliasName}" is not an alias (or resolves to itself).`);
      } else {
        console.log(`"${aliasName}" -> "${resolved}"`);
      }
    });

  alias
    .command('list')
    .description('List all defined aliases')
    .action(() => {
      const aliases = listAliases();
      const entries = Object.entries(aliases);
      if (entries.length === 0) {
        console.log('No aliases defined.');
      } else {
        entries.forEach(([a, p]) => console.log(`  ${a} -> ${p}`));
      }
    });
}

module.exports = { registerAliasCommands };
