/**
 * linkerCommands.js
 * CLI commands for managing env key links.
 */

const { addLink, removeLink, listLinks, resolveLinks } = require('./envLinker');

function registerLinkerCommands(program) {
  const linker = program.command('link').description('Manage key links across vaults');

  linker
    .command('add <sourceVault> <sourceKey> <targetVault> <targetKey>')
    .description('Link a key from one vault to another')
    .action((sourceVault, sourceKey, targetVault, targetKey) => {
      try {
        const link = addLink(sourceVault, sourceKey, targetVault, targetKey);
        console.log(`Linked: ${link.sourceVault}:${link.sourceKey} -> ${link.targetVault}:${link.targetKey}`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  linker
    .command('remove <sourceVault> <sourceKey> <targetVault> <targetKey>')
    .description('Remove an existing key link')
    .action((sourceVault, sourceKey, targetVault, targetKey) => {
      try {
        removeLink(sourceVault, sourceKey, targetVault, targetKey);
        console.log('Link removed.');
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  linker
    .command('list')
    .description('List all key links')
    .action(() => {
      const links = listLinks();
      if (!links.length) { console.log('No links defined.'); return; }
      links.forEach(l => console.log(`${l.sourceVault}:${l.sourceKey} -> ${l.targetVault}:${l.targetKey} (created: ${l.createdAt})`));
    });

  linker
    .command('resolve <vault> <key>')
    .description('Show all links originating from a vault key')
    .action((vault, key) => {
      const links = resolveLinks(vault, key);
      if (!links.length) { console.log('No links found for this key.'); return; }
      links.forEach(l => console.log(`-> ${l.targetVault}:${l.targetKey}`));
    });
}

module.exports = { registerLinkerCommands };
