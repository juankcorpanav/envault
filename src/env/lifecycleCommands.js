/**
 * lifecycleCommands.js
 * CLI commands for managing env key lifecycle hooks.
 */

const {
  registerLifecycleHook,
  removeLifecycleHook,
  getLifecycleHooks,
  listAllLifecycleHooks,
  triggerLifecycleHook,
} = require('./envLifecycle');

function registerLifecycleCommands(program) {
  const lifecycle = program
    .command('lifecycle')
    .description('Manage lifecycle hooks for env keys');

  lifecycle
    .command('set <key> <event> <command>')
    .description('Register a lifecycle hook for a key (events: onCreate, onUpdate, onDelete)')
    .action((key, event, command) => {
      try {
        const hook = registerLifecycleHook(key, event, command);
        console.log(`Lifecycle hook registered for key "${key}" on event "${event}".`);
        console.log(JSON.stringify(hook, null, 2));
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  lifecycle
    .command('remove <key> <event>')
    .description('Remove a lifecycle hook for a key and event')
    .action((key, event) => {
      removeLifecycleHook(key, event);
      console.log(`Lifecycle hook for "${key}" on "${event}" removed.`);
    });

  lifecycle
    .command('get <key>')
    .description('Show all lifecycle hooks for a key')
    .action((key) => {
      const hooks = getLifecycleHooks(key);
      if (Object.keys(hooks).length === 0) {
        console.log(`No lifecycle hooks registered for key "${key}".`);
      } else {
        console.log(JSON.stringify(hooks, null, 2));
      }
    });

  lifecycle
    .command('list')
    .description('List all registered lifecycle hooks')
    .action(() => {
      const all = listAllLifecycleHooks();
      if (Object.keys(all).length === 0) {
        console.log('No lifecycle hooks registered.');
      } else {
        console.log(JSON.stringify(all, null, 2));
      }
    });

  lifecycle
    .command('trigger <key> <event>')
    .description('Simulate triggering a lifecycle hook')
    .action((key, event) => {
      const result = triggerLifecycleHook(key, event, { source: 'cli' });
      if (!result) {
        console.log(`No lifecycle hook found for "${key}" on "${event}".`);
      } else {
        console.log('Lifecycle hook triggered:');
        console.log(JSON.stringify(result, null, 2));
      }
    });
}

module.exports = { registerLifecycleCommands };
