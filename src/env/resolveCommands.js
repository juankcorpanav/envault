/**
 * resolveCommands.js
 * CLI commands for resolving env variable interpolations.
 */

const { parseEnv, serializeEnv } = require('../secrets/envParser');
const { resolveEnv, listUnresolved } = require('./envResolve');
const fs = require('fs');

/**
 * @param {import('commander').Command} program
 */
function registerResolveCommands(program) {
  program
    .command('resolve <envFile>')
    .description('Resolve ${VAR} interpolations in an env file and print the result')
    .option('-o, --output <file>', 'Write resolved output to a file instead of stdout')
    .option('--check', 'Exit with error if any references remain unresolved')
    .action((envFile, options) => {
      if (!fs.existsSync(envFile)) {
        console.error(`File not found: ${envFile}`);
        process.exit(1);
      }

      const raw = fs.readFileSync(envFile, 'utf8');
      const parsed = parseEnv(raw);
      const resolved = resolveEnv(parsed);
      const unresolved = listUnresolved(resolved);

      if (options.check && unresolved.length > 0) {
        console.error(`Unresolved references: ${unresolved.join(', ')}`);
        process.exit(1);
      }

      const output = serializeEnv(resolved);

      if (options.output) {
        fs.writeFileSync(options.output, output, 'utf8');
        console.log(`Resolved env written to ${options.output}`);
      } else {
        process.stdout.write(output);
      }

      if (unresolved.length > 0) {
        console.warn(`Warning: unresolved references: ${unresolved.join(', ')}`);
      }
    });

  program
    .command('resolve:check <envFile>')
    .description('Report any unresolved ${VAR} references in an env file')
    .action((envFile) => {
      if (!fs.existsSync(envFile)) {
        console.error(`File not found: ${envFile}`);
        process.exit(1);
      }

      const raw = fs.readFileSync(envFile, 'utf8');
      const parsed = parseEnv(raw);
      const resolved = resolveEnv(parsed);
      const unresolved = listUnresolved(resolved);

      if (unresolved.length === 0) {
        console.log('All references resolved.');
      } else {
        console.log('Unresolved references:');
        unresolved.forEach((key) => console.log(`  - ${key}`));
        process.exit(1);
      }
    });
}

module.exports = { registerResolveCommands };
