/**
 * flattenCommands.js
 * CLI commands for flattening and expanding env structures.
 */

const fs = require('fs');
const { flattenObject, expandEnv } = require('./envFlatten');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

/**
 * @param {import('commander').Command} program
 */
function registerFlattenCommands(program) {
  program
    .command('flatten <jsonFile> <outEnvFile>')
    .description('Flatten a JSON file into a .env file using dot-notation keys')
    .option('--depth <n>', 'Max nesting depth for keys', '2')
    .action((jsonFile, outEnvFile, opts) => {
      if (!fs.existsSync(jsonFile)) {
        console.error(`File not found: ${jsonFile}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(jsonFile, 'utf8');
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.error('Invalid JSON:', e.message);
        process.exit(1);
      }
      const flat = flattenObject(parsed);
      fs.writeFileSync(outEnvFile, serializeEnv(flat), 'utf8');
      console.log(`Flattened ${Object.keys(flat).length} keys → ${outEnvFile}`);
    });

  program
    .command('expand <envFile> <outJsonFile>')
    .description('Expand a .env file with dot-notation keys into a nested JSON file')
    .option('--depth <n>', 'Max nesting depth to expand', '2')
    .action((envFile, outJsonFile, opts) => {
      if (!fs.existsSync(envFile)) {
        console.error(`File not found: ${envFile}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(envFile, 'utf8');
      const env = parseEnv(raw);
      const depth = parseInt(opts.depth, 10);
      const expanded = expandEnv(env, depth);
      fs.writeFileSync(outJsonFile, JSON.stringify(expanded, null, 2), 'utf8');
      console.log(`Expanded ${Object.keys(env).length} keys → ${outJsonFile}`);
    });
}

module.exports = { registerFlattenCommands };
