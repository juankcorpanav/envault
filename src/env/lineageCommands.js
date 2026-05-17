/**
 * lineageCommands.js
 * CLI commands for env key lineage tracking.
 */

const {
  recordLineage,
  getKeyLineage,
  clearKeyLineage,
  listTrackedKeys,
  formatLineageReport,
} = require('./envLineage');

function registerLineageCommands(program) {
  const lineage = program.command('lineage').description('Track and inspect env key lineage');

  lineage
    .command('record <vault> <key>')
    .description('Record a lineage event for a key')
    .requiredOption('--action <action>', 'Action label (e.g. imported, rotated, cloned)')
    .option('--source <source>', 'Source of the value')
    .option('--by <actor>', 'Actor who performed the action')
    .action((vault, key, opts) => {
      const entry = { action: opts.action };
      if (opts.source) entry.source = opts.source;
      if (opts.by) entry.by = opts.by;
      const history = recordLineage(vault, key, entry);
      console.log(`Recorded lineage event for "${key}". Total entries: ${history.length}`);
    });

  lineage
    .command('show <vault> <key>')
    .description('Show lineage report for a key')
    .action((vault, key) => {
      console.log(formatLineageReport(vault, key));
    });

  lineage
    .command('list <vault>')
    .description('List all keys with lineage tracked in a vault')
    .action((vault) => {
      const keys = listTrackedKeys(vault);
      if (!keys.length) {
        console.log(`No lineage data found for vault "${vault}".`);
      } else {
        console.log(`Tracked keys in "${vault}":\n` + keys.map((k) => `  - ${k}`).join('\n'));
      }
    });

  lineage
    .command('clear <vault> <key>')
    .description('Clear lineage history for a specific key')
    .action((vault, key) => {
      clearKeyLineage(vault, key);
      console.log(`Lineage cleared for "${key}" in vault "${vault}".`);
    });

  return lineage;
}

module.exports = { registerLineageCommands };
