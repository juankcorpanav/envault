/**
 * remapCommands.js
 * CLI commands for managing and applying env key remappings.
 */

const { parseEnv, serializeEnv } = require('../secrets/envParser');
const fs = require('fs');
const {
  loadRemap,
  saveRemap,
  applyRemap,
  invertRemap,
  remapEnvFile,
  listRemaps,
  deleteRemap,
} = require('./envRemapping');

function registerRemapCommands(program) {
  const remap = program.command('remap').description('Manage env key remapping profiles');

  remap
    .command('save <name> <mappingJson>')
    .description('Save a remap profile (JSON string: {"OLD":"NEW"})')
    .action((name, mappingJson) => {
      const mapping = JSON.parse(mappingJson);
      saveRemap(name, mapping);
      console.log(`Remap profile "${name}" saved with ${Object.keys(mapping).length} rule(s).`);
    });

  remap
    .command('list')
    .description('List all saved remap profiles')
    .action(() => {
      const profiles = listRemaps();
      if (!profiles.length) return console.log('No remap profiles found.');
      profiles.forEach(p => console.log(` - ${p}`));
    });

  remap
    .command('show <name>')
    .description('Show a saved remap profile')
    .action((name) => {
      const mapping = loadRemap(name);
      console.log(JSON.stringify(mapping, null, 2));
    });

  remap
    .command('apply <name> <envFile>')
    .description('Apply a remap profile to an env file and print result')
    .option('--drop-unmapped', 'Drop keys not in the mapping')
    .action((name, envFile, opts) => {
      const mapping = loadRemap(name);
      const result = remapEnvFile(envFile, mapping, { dropUnmapped: !!opts.dropUnmapped });
      console.log(serializeEnv(result));
    });

  remap
    .command('invert <name>')
    .description('Print the inverse of a remap profile')
    .action((name) => {
      const mapping = loadRemap(name);
      console.log(JSON.stringify(invertRemap(mapping), null, 2));
    });

  remap
    .command('delete <name>')
    .description('Delete a remap profile')
    .action((name) => {
      deleteRemap(name);
      console.log(`Remap profile "${name}" deleted.`);
    });
}

module.exports = { registerRemapCommands };
