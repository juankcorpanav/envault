const { obfuscateEnv, listObfuscatedKeys, formatObfuscateReport } = require('./envObfuscate');
const { parseEnv, serializeEnv } = require('../secrets/envParser');
const fs = require('fs');

/**
 * Registers obfuscate-related CLI commands onto a commander program.
 * @param {import('commander').Command} program
 */
function registerObfuscateCommands(program) {
  const obfuscate = program.command('obfuscate').description('Obfuscate sensitive env values');

  obfuscate
    .command('run <file>')
    .description('Obfuscate sensitive keys in an env file and print result')
    .option('-e, --extra <keys>', 'Comma-separated extra keys to obfuscate', '')
    .option('--in-place', 'Overwrite the original file with obfuscated values')
    .action((file, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(file, 'utf8');
      const env = parseEnv(raw);
      const extraKeys = opts.extra ? opts.extra.split(',').map((k) => k.trim()).filter(Boolean) : [];
      const obfuscated = obfuscateEnv(env, extraKeys);
      const output = serializeEnv(obfuscated);
      if (opts.inPlace) {
        fs.writeFileSync(file, output, 'utf8');
        console.log(`Obfuscated file written to ${file}`);
      } else {
        console.log(output);
      }
    });

  obfuscate
    .command('list <file>')
    .description('List keys that would be obfuscated in an env file')
    .option('-e, --extra <keys>', 'Comma-separated extra keys to include', '')
    .action((file, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(file, 'utf8');
      const env = parseEnv(raw);
      const extraKeys = opts.extra ? opts.extra.split(',').map((k) => k.trim()).filter(Boolean) : [];
      const keys = listObfuscatedKeys(env, extraKeys);
      if (keys.length === 0) {
        console.log('No obfuscatable keys found.');
      } else {
        console.log(`Obfuscatable keys (${keys.length}):`);
        keys.forEach((k) => console.log(`  - ${k}`));
      }
    });

  obfuscate
    .command('report <file>')
    .description('Print an obfuscation report for an env file')
    .option('-e, --extra <keys>', 'Comma-separated extra keys to include', '')
    .action((file, opts) => {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(file, 'utf8');
      const env = parseEnv(raw);
      const extraKeys = opts.extra ? opts.extra.split(',').map((k) => k.trim()).filter(Boolean) : [];
      console.log(formatObfuscateReport(env, extraKeys));
    });
}

module.exports = { registerObfuscateCommands };
