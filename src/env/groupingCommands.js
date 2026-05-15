/**
 * groupingCommands.js — CLI commands for env key grouping
 */

const {
  addKeyToGroup,
  removeKeyFromGroup,
  getGroup,
  listGroups,
  deleteGroup,
  autoGroupByPrefix,
} = require('./envGrouping');
const { parseEnv } = require('../secrets/envParser');
const fs = require('fs');

function registerGroupingCommands(program) {
  const group = program.command('group').description('Manage env key groups');

  group
    .command('add <groupName> <key>')
    .description('Add a key to a group')
    .action((groupName, key) => {
      const keys = addKeyToGroup(groupName, key);
      console.log(`Added '${key}' to group '${groupName}'. Members: ${keys.join(', ')}`);
    });

  group
    .command('remove <groupName> <key>')
    .description('Remove a key from a group')
    .action((groupName, key) => {
      removeKeyFromGroup(groupName, key);
      console.log(`Removed '${key}' from group '${groupName}'.`);
    });

  group
    .command('show <groupName>')
    .description('Show keys in a group')
    .action((groupName) => {
      const keys = getGroup(groupName);
      if (keys.length === 0) {
        console.log(`Group '${groupName}' is empty or does not exist.`);
      } else {
        console.log(`Group '${groupName}': ${keys.join(', ')}`);
      }
    });

  group
    .command('list')
    .description('List all groups')
    .action(() => {
      const groups = listGroups();
      const names = Object.keys(groups);
      if (names.length === 0) {
        console.log('No groups defined.');
      } else {
        names.forEach(name => {
          console.log(`${name}: ${groups[name].join(', ')}`);
        });
      }
    });

  group
    .command('delete <groupName>')
    .description('Delete a group')
    .action((groupName) => {
      const deleted = deleteGroup(groupName);
      console.log(deleted ? `Deleted group '${groupName}'.` : `Group '${groupName}' not found.`);
    });

  group
    .command('auto <envFile>')
    .description('Auto-group keys by prefix from an env file')
    .action((envFile) => {
      const content = fs.readFileSync(envFile, 'utf8');
      const parsed = parseEnv(content);
      const result = autoGroupByPrefix(parsed);
      Object.entries(result).forEach(([prefix, keys]) => {
        console.log(`${prefix}: ${keys.join(', ')}`);
      });
    });

  return program;
}

module.exports = { registerGroupingCommands };
