/**
 * pinCommands.js — CLI commands for env key pinning.
 */

const { pinKey, unpinKey, listPinned } = require('./envPinning');

function registerPinCommands(program) {
  const pin = program.command('pin').description('Manage pinned env keys');

  pin
    .command('add <vault> <key>')
    .description('Pin a key to prevent modification or deletion')
    .action((vault, key) => {
      const result = pinKey(vault, key);
      if (result.pinned) {
        console.log(`Pinned key "${key}" in vault "${vault}".`);
      } else {
        console.warn(`Warning: ${result.reason}`);
      }
    });

  pin
    .command('remove <vault> <key>')
    .description('Unpin a key')
    .action((vault, key) => {
      const result = unpinKey(vault, key);
      if (result.unpinned) {
        console.log(`Unpinned key "${key}" in vault "${vault}".`);
      } else {
        console.warn(`Warning: ${result.reason}`);
      }
    });

  pin
    .command('list <vault>')
    .description('List all pinned keys for a vault')
    .action((vault) => {
      const pins = listPinned(vault);
      if (pins.length === 0) {
        console.log(`No pinned keys in vault "${vault}".`);
      } else {
        console.log(`Pinned keys in vault "${vault}":\n${pins.map((k) => `  - ${k}`).join('\n')}`);
      }
    });
}

module.exports = { registerPinCommands };
