/**
 * profileCommands.js
 * CLI commands for managing environment profiles.
 */

const { saveProfile, loadProfile, listProfiles, deleteProfile, renameProfile } = require('./envProfile');
const { parseEnv } = require('../secrets/envParser');
const fs = require('fs');

function registerProfileCommands(program) {
  const profile = program.command('profile').description('Manage environment profiles');

  profile
    .command('save <name> <envFile>')
    .description('Save an env file as a named profile')
    .action((name, envFile) => {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        const envObject = parseEnv(content);
        const result = saveProfile(name, envObject);
        console.log(`Profile "${result.name}" saved with ${result.keys} key(s).`);
      } catch (err) {
        console.error(`Error saving profile: ${err.message}`);
        process.exitCode = 1;
      }
    });

  profile
    .command('load <name>')
    .description('Print the env variables from a named profile')
    .action((name) => {
      try {
        const envObject = loadProfile(name);
        Object.entries(envObject).forEach(([k, v]) => console.log(`${k}=${v}`));
      } catch (err) {
        console.error(`Error loading profile: ${err.message}`);
        process.exitCode = 1;
      }
    });

  profile
    .command('list')
    .description('List all saved profiles')
    .action(() => {
      const profiles = listProfiles();
      if (profiles.length === 0) {
        console.log('No profiles found.');
      } else {
        profiles.forEach(p => console.log(` - ${p}`));
      }
    });

  profile
    .command('delete <name>')
    .description('Delete a named profile')
    .action((name) => {
      try {
        deleteProfile(name);
        console.log(`Profile "${name}" deleted.`);
      } catch (err) {
        console.error(`Error deleting profile: ${err.message}`);
        process.exitCode = 1;
      }
    });

  profile
    .command('rename <oldName> <newName>')
    .description('Rename a profile')
    .action((oldName, newName) => {
      try {
        const result = renameProfile(oldName, newName);
        console.log(`Profile renamed from "${result.renamed.from}" to "${result.renamed.to}".`);
      } catch (err) {
        console.error(`Error renaming profile: ${err.message}`);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerProfileCommands };
