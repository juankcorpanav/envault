/**
 * tokenizeCommands.js
 * CLI commands for env value tokenization inspection.
 */

const fs = require('fs');
const { parseEnv } = require('../secrets/envParser');
const { tokenizeEnv, listTokenTypes, filterByTokenType, TOKEN_TYPES } = require('./envTokenize');

function registerTokenizeCommands(program) {
  const tokenize = program
    .command('tokenize')
    .description('Inspect and analyze env value tokens');

  tokenize
    .command('inspect <envFile>')
    .description('Tokenize all values in an env file and display token breakdown')
    .option('--type <type>', `Filter by token type (${TOKEN_TYPES.join('|')})`)
    .action((envFile, opts) => {
      const raw = fs.readFileSync(envFile, 'utf8');
      const parsed = parseEnv(raw);
      let tokenized = tokenizeEnv(parsed);

      if (opts.type) {
        tokenized = filterByTokenType(tokenized, opts.type);
      }

      const keys = Object.keys(tokenized);
      if (keys.length === 0) {
        console.log('No matching keys found.');
        return;
      }

      for (const key of keys) {
        const tokens = tokenized[key];
        const summary = tokens.map(t => `[${t.type}: ${t.inner ?? t.raw}]`).join(' ');
        console.log(`${key} => ${summary}`);
      }
    });

  tokenize
    .command('types <envFile>')
    .description('List all token types present in the env file')
    .action((envFile) => {
      const raw = fs.readFileSync(envFile, 'utf8');
      const parsed = parseEnv(raw);
      const tokenized = tokenizeEnv(parsed);
      const types = listTokenTypes(tokenized);
      if (types.length === 0) {
        console.log('No tokens detected.');
      } else {
        console.log('Token types found:', types.join(', '));
      }
    });

  tokenize
    .command('list-types')
    .description('List all supported token types')
    .action(() => {
      console.log('Supported token types:', TOKEN_TYPES.join(', '));
    });
}

module.exports = { registerTokenizeCommands };
