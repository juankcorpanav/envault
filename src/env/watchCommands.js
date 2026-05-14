const path = require('path');
const { watchEnvFile, unwatchEnvFile, listWatched } = require('./envWatch');
const { diffEnv, formatDiff } = require('../diff/envDiff');

/**
 * Register CLI commands for env file watching.
 * @param {import('commander').Command} program
 */
function registerWatchCommands(program) {
  const watch = program.command('watch').description('Watch .env files for live changes');

  watch
    .command('start <vault> <file>')
    .description('Start watching a .env file for changes')
    .option('--diff', 'Print a diff on each change', false)
    .action((vault, file, opts) => {
      const absPath = path.resolve(file);
      try {
        watchEnvFile(vault, absPath, (vaultName, oldEnv, newEnv) => {
          console.log(`[watch] Change detected in vault "${vaultName}"`);
          if (opts.diff) {
            const diff = diffEnv(oldEnv, newEnv);
            const lines = formatDiff(diff);
            if (lines.length === 0) {
              console.log('  (no effective changes)');
            } else {
              lines.forEach((l) => console.log(' ', l));
            }
          }
        });
        console.log(`Watching "${absPath}" for vault "${vault}". Press Ctrl+C to stop.`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  watch
    .command('stop <vault>')
    .description('Stop watching a vault file')
    .action((vault) => {
      const stopped = unwatchEnvFile(vault);
      if (stopped) {
        console.log(`Stopped watching vault "${vault}".`);
      } else {
        console.error(`No active watcher for vault "${vault}".`);
        process.exitCode = 1;
      }
    });

  watch
    .command('list')
    .description('List all actively watched vaults')
    .action(() => {
      const watched = listWatched();
      if (watched.length === 0) {
        console.log('No vaults are currently being watched.');
      } else {
        watched.forEach(({ vaultName, filePath }) => {
          console.log(`  ${vaultName} -> ${filePath}`);
        });
      }
    });
}

module.exports = { registerWatchCommands };
