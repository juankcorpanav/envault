/**
 * hookCommands.js — CLI commands for managing and inspecting env hooks
 */

const { registerHook, unregisterHook, clearHooks, listHooks } = require('./envHooks');

/**
 * Register hook-related CLI commands onto a commander program.
 * @param {import('commander').Command} program
 */
function registerHookCommands(program) {
  const hook = program.command('hook').description('Manage vault lifecycle hooks');

  hook
    .command('list')
    .description('List all registered hooks and their counts')
    .action(() => {
      const summary = listHooks();
      const entries = Object.entries(summary);
      if (entries.length === 0) {
        console.log('No hooks registered.');
        return;
      }
      console.log('Registered hooks:');
      for (const [event, count] of entries) {
        console.log(`  ${event}: ${count} handler(s)`);
      }
    });

  hook
    .command('clear [event]')
    .description('Clear all hooks for a specific event, or all hooks if no event given')
    .action((event) => {
      try {
        clearHooks(event);
        const msg = event ? `Cleared hooks for "${event}"` : 'Cleared all hooks';
        console.log(msg);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}

module.exports = { registerHookCommands };
