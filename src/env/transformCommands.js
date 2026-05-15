const { transformEnv, listTransforms } = require('./envTransform');
const { parseEnv, serializeEnv } = require('../secrets/envParser');
const fs = require('fs');

function registerTransformCommands(program) {
  const transform = program.command('transform').description('Apply value transforms to env keys');

  transform
    .command('apply <file>')
    .description('Apply transforms defined via --rule KEY:TRANSFORM options')
    .option('-r, --rule <entries...>', 'Key:transform pairs, e.g. SECRET:mask DB_URL:trim')
    .option('-o, --output <file>', 'Write result to file (default: overwrite input)')
    .option('--dry-run', 'Print result without writing')
    .action((file, opts) => {
      const raw = fs.readFileSync(file, 'utf8');
      const parsed = parseEnv(raw);
      const rules = {};
      for (const entry of opts.rule || []) {
        const idx = entry.indexOf(':');
        if (idx === -1) { console.error(`Invalid rule: ${entry}`); process.exit(1); }
        const key = entry.slice(0, idx);
        const spec = entry.slice(idx + 1);
        rules[key] = rules[key] ? [].concat(rules[key], spec) : spec;
      }
      const result = transformEnv(parsed, rules);
      const out = serializeEnv(result);
      if (opts.dryRun) {
        console.log(out);
      } else {
        const dest = opts.output || file;
        fs.writeFileSync(dest, out, 'utf8');
        console.log(`Transforms applied → ${dest}`);
      }
    });

  transform
    .command('list')
    .description('List available built-in transforms')
    .action(() => {
      const names = listTransforms();
      console.log('Available transforms:');
      names.forEach((n) => console.log(`  - ${n}`));
    });

  return program;
}

module.exports = { registerTransformCommands };
