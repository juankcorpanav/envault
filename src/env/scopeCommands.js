/**
 * scopeCommands.js — CLI commands for env scope management
 */

const {
  assignScope,
  removeFromScope,
  getKeysInScope,
  getScopesForKey,
  listScopes,
} = require('./envScope');

function registerScopeCommands(program) {
  const scope = program.command('scope').description('Manage env key scopes');

  scope
    .command('assign <vault> <key> <scope>')
    .description('Assign a key to a scope')
    .action((vault, key, scopeName) => {
      assignScope(vault, key, scopeName);
      console.log(`Key "${key}" assigned to scope "${scopeName}" in vault "${vault}".`);
    });

  scope
    .command('remove <vault> <key> <scope>')
    .description('Remove a key from a scope')
    .action((vault, key, scopeName) => {
      removeFromScope(vault, key, scopeName);
      console.log(`Key "${key}" removed from scope "${scopeName}" in vault "${vault}".`);
    });

  scope
    .command('keys <vault> <scope>')
    .description('List keys in a scope')
    .action((vault, scopeName) => {
      const keys = getKeysInScope(vault, scopeName);
      if (keys.length === 0) {
        console.log(`No keys in scope "${scopeName}".`);
      } else {
        console.log(`Keys in scope "${scopeName}":\n` + keys.map(k => `  - ${k}`).join('\n'));
      }
    });

  scope
    .command('of <vault> <key>')
    .description('List scopes a key belongs to')
    .action((vault, key) => {
      const scopes = getScopesForKey(vault, key);
      if (scopes.length === 0) {
        console.log(`Key "${key}" is not in any scope.`);
      } else {
        console.log(`Scopes for "${key}":\n` + scopes.map(s => `  - ${s}`).join('\n'));
      }
    });

  scope
    .command('list <vault>')
    .description('List all scopes in a vault')
    .action((vault) => {
      const scopes = listScopes(vault);
      if (scopes.length === 0) {
        console.log('No scopes defined.');
      } else {
        console.log('Scopes:\n' + scopes.map(s => `  - ${s}`).join('\n'));
      }
    });
}

module.exports = { registerScopeCommands };
