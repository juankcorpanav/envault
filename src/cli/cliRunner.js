#!/usr/bin/env node
'use strict';

const {
  cmdGet, cmdSet, cmdDelete, cmdList,
  cmdRotate, cmdExport, cmdImport
} = require('./cliCommands');

const USAGE = `
envault CLI

Usage:
  envault list
  envault get <vault> [key]
  envault set <vault> <key> <value>
  envault delete <vault> <key>
  envault rotate <vault> <key>
  envault export <vault> <passphrase>
  envault import <vault> <passphrase> <payload>
`;

async function run(argv) {
  const [,, command, ...args] = argv;

  try {
    let result;
    switch (command) {
      case 'list':
        result = await cmdList();
        console.log('Vaults:', result.vaults.join(', ') || '(none)');
        break;
      case 'get': {
        const [vault, key] = args;
        if (!vault) throw new Error('Usage: envault get <vault> [key]');
        result = await cmdGet(vault, key);
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      case 'set': {
        const [vault, key, value] = args;
        if (!vault || !key || value === undefined) throw new Error('Usage: envault set <vault> <key> <value>');
        result = await cmdSet(vault, key, value);
        console.log(`Set "${key}" in vault "${vault}".`);
        break;
      }
      case 'delete': {
        const [vault, key] = args;
        if (!vault || !key) throw new Error('Usage: envault delete <vault> <key>');
        result = await cmdDelete(vault, key);
        console.log(`Deleted "${key}" from vault "${vault}".`);
        break;
      }
      case 'rotate': {
        const [vault, key] = args;
        if (!vault || !key) throw new Error('Usage: envault rotate <vault> <key>');
        result = await cmdRotate(vault, key);
        console.log(`Rotated "${key}" in vault "${vault}". New value: ${result.newValue}`);
        break;
      }
      case 'export': {
        const [vault, passphrase] = args;
        if (!vault || !passphrase) throw new Error('Usage: envault export <vault> <passphrase>');
        result = await cmdExport(vault, passphrase);
        console.log(JSON.stringify(result));
        break;
      }
      case 'import': {
        const [vault, passphrase, payload] = args;
        if (!vault || !passphrase || !payload) throw new Error('Usage: envault import <vault> <passphrase> <payload>');
        result = await cmdImport(vault, JSON.parse(payload), passphrase);
        console.log(`Imported ${result.keys.length} key(s) into vault "${vault}".`);
        break;
      }
      default:
        console.log(USAGE);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run(process.argv);
