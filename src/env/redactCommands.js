/**
 * redactCommands.js — CLI commands for redacting sensitive env values
 */

const fs = require('fs');
const { parseEnv, serializeEnv } = require('../secrets/envParser');
const { redactEnv, listRedactedKeys } = require('./envRedact');

/**
 * @param {import('commander').Command} program
 */
function registerRedactCommands(program) {
  const redact = program.command('redact').description('Redact sensitive env values');

  redact
    .command('show <file>')
    .description('Print env file with sensitive values redacted')
    .option('-k, --keys <keys>', 'Additional keys to redact (comma-separated)', '')
    .action((file, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(file, 'utf8');
      const env = parseEnv(raw);
      const additionalKeys = opts.keys ? opts.keys.split(',').map((k) => k.trim()).filter(Boolean) : [];
      const redacted = redactEnv(env, { additionalKeys });
      console.log(serializeEnv(redacted));
    });

  redact
    .command('list <file>')
    .description('List keys that would be redacted')
    .option('-k, --keys <keys>', 'Additional keys to redact (comma-separated)', '')
    .action((file, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(file, 'utf8');
      const env = parseEnv(raw);
      const additionalKeys = opts.keys ? opts.keys.split(',').map((k) => k.trim()).filter(Boolean) : [];
      const keys = listRedactedKeys(env, { additionalKeys });
      if (keys.length === 0) {
        console.log('No sensitive keys detected.');
      } else {
        console.log('Sensitive keys:');
        keys.forEach((k) => console.log(`  - ${k}`));
      }
    });
}

module.exports = { registerRedactCommands };
