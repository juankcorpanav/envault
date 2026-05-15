/**
 * splitCommands.js — CLI commands for env splitting feature
 */

const { splitEnvFile } = require('./envSplit');

/**
 * @param {import('commander').Command} program
 */
function registerSplitCommands(program) {
  program
    .command('split <envFile>')
    .description('Split an .env file into multiple files by key prefix')
    .requiredOption('-p, --prefixes <prefixes>', 'Comma-separated list of key prefixes (e.g. DB_,AWS_,APP_)')
    .option('-o, --out-dir <dir>', 'Output directory for split files', './split-env')
    .option('--remainder-name <name>', 'Filename suffix for unmatched keys', 'remainder')
    .action((envFile, opts) => {
      const prefixes = opts.prefixes.split(',').map(p => p.trim()).filter(Boolean);
      if (prefixes.length === 0) {
        console.error('Error: at least one prefix is required.');
        process.exit(1);
      }

      try {
        const { splitByPrefix, writeSplitFiles } = require('./envSplit');
        const { parseEnv } = require('../secrets/envParser');
        const fs = require('fs');

        const raw = fs.readFileSync(envFile, 'utf8');
        const env = parseEnv(raw);
        const result = splitByPrefix(env, prefixes);
        const written = writeSplitFiles(result, opts.outDir, opts.remainderName);

        console.log(`Split into ${written.length} file(s):`);
        written.forEach(f => console.log(`  ${f}`));

        const remainderCount = Object.keys(result.remainder).length;
        if (remainderCount > 0) {
          console.log(`  (${remainderCount} unmatched key(s) written to remainder file)`);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  program
    .command('split-preview <envFile>')
    .description('Preview how an .env file would be split by prefix (no files written)')
    .requiredOption('-p, --prefixes <prefixes>', 'Comma-separated list of key prefixes')
    .action((envFile, opts) => {
      const prefixes = opts.prefixes.split(',').map(p => p.trim()).filter(Boolean);
      try {
        const { splitByPrefix } = require('./envSplit');
        const { parseEnv } = require('../secrets/envParser');
        const fs = require('fs');

        const raw = fs.readFileSync(envFile, 'utf8');
        const env = parseEnv(raw);
        const { groups, remainder } = splitByPrefix(env, prefixes);

        for (const [group, keys] of Object.entries(groups)) {
          console.log(`[${group}] (${Object.keys(keys).length} keys): ${Object.keys(keys).join(', ')}`);
        }
        const remKeys = Object.keys(remainder);
        if (remKeys.length > 0) {
          console.log(`[remainder] (${remKeys.length} keys): ${remKeys.join(', ')}`);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}

module.exports = { registerSplitCommands };
