/**
 * castCommands.js — CLI commands for env value type casting
 */

const { castValue, castEnv, listCastTypes, formatCastReport } = require('./envCast');
const { parseEnv, serializeEnv } = require('../secrets/envParser');
const fs = require('fs');

function registerCastCommands(program) {
  const cast = program.command('cast').description('Type casting for env values');

  cast
    .command('value <value> <type>')
    .description('Cast a single value to a given type')
    .action((value, type) => {
      try {
        const result = castValue(value, type);
        console.log(JSON.stringify(result));
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cast
    .command('file <envFile> <schemaJson>')
    .description('Cast all keys in an env file using a JSON schema map (key => type)')
    .option('-o, --output <file>', 'Write result to file instead of stdout')
    .action((envFile, schemaJson, opts) => {
      try {
        const raw = fs.readFileSync(envFile, 'utf8');
        const env = parseEnv(raw);
        const schema = JSON.parse(schemaJson);
        const casted = castEnv(env, schema);
        const out = serializeEnv(casted);
        if (opts.output) {
          fs.writeFileSync(opts.output, out, 'utf8');
          console.log(`Written to ${opts.output}`);
        } else {
          console.log(out);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  cast
    .command('types')
    .description('List supported cast types')
    .action(() => {
      console.log(listCastTypes().join(', '));
    });

  return program;
}

module.exports = { registerCastCommands };
