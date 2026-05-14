const { recordChange, getHistory, clearHistory, undoLast } = require('./envHistory');
const { readVault, updateVault, deleteVaultKey } = require('../vault/vaultAccess');

function registerHistoryCommands(program) {
  const history = program.command('history').description('Manage key change history for a vault');

  history
    .command('list <vault>')
    .description('List recent changes for a vault')
    .option('-k, --key <key>', 'Filter by key')
    .option('-n, --limit <n>', 'Max entries to show', '20')
    .action((vault, opts) => {
      const entries = getHistory(vault, { key: opts.key, limit: parseInt(opts.limit, 10) });
      if (entries.length === 0) {
        console.log('No history found.');
        return;
      }
      entries.forEach(e => {
        console.log(`[${e.timestamp}] ${e.action.toUpperCase()} ${e.key} by ${e.user} (id: ${e.id})`);
        if (e.oldValue !== null) console.log(`  old: ${e.oldValue}`);
        if (e.newValue !== null) console.log(`  new: ${e.newValue}`);
      });
    });

  history
    .command('undo <vault>')
    .description('Undo the last recorded change for a vault')
    .action((vault, _opts) => {
      const last = undoLast(vault);
      if (!last) {
        console.log('Nothing to undo.');
        return;
      }
      if (last.action === 'set' && last.oldValue !== null) {
        updateVault(vault, last.key, last.oldValue);
        console.log(`Reverted ${last.key} to previous value.`);
      } else if (last.action === 'set' && last.oldValue === null) {
        deleteVaultKey(vault, last.key);
        console.log(`Removed ${last.key} (was newly added).`);
      } else if (last.action === 'delete' && last.oldValue !== null) {
        updateVault(vault, last.key, last.oldValue);
        console.log(`Restored deleted key ${last.key}.`);
      } else {
        console.log(`Cannot undo action: ${last.action}`);
      }
    });

  history
    .command('clear <vault>')
    .description('Clear all history for a vault')
    .action((vault) => {
      clearHistory(vault);
      console.log(`History cleared for vault: ${vault}`);
    });
}

module.exports = { registerHistoryCommands };
