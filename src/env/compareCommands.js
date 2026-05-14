/**
 * compareCommands.js
 * CLI commands for comparing env profiles and vaults.
 */

const { compareProfiles, compareVaults, compareProfileToVault } = require('./envCompare');

/**
 * Register compare commands on a Commander program.
 * @param {import('commander').Command} program
 */
function registerCompareCommands(program) {
  const compare = program
    .command('compare')
    .description('Compare env profiles or vaults');

  compare
    .command('profiles <nameA> <nameB>')
    .description('Diff two env profiles')
    .option('--json', 'Output raw JSON diff')
    .action((nameA, nameB, opts) => {
      try {
        const { diff, summary } = compareProfiles(nameA, nameB);
        if (opts.json) {
          console.log(JSON.stringify(diff, null, 2));
        } else {
          console.log(`Comparing profiles: ${nameA} → ${nameB}`);
          console.log(summary || '(no differences)');
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  compare
    .command('vaults <pathA> <pathB>')
    .description('Diff two vault files')
    .option('--json', 'Output raw JSON diff')
    .action((pathA, pathB, opts) => {
      try {
        const { diff, summary } = compareVaults(pathA, pathB);
        if (opts.json) {
          console.log(JSON.stringify(diff, null, 2));
        } else {
          console.log(`Comparing vaults: ${pathA} → ${pathB}`);
          console.log(summary || '(no differences)');
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  compare
    .command('profile-vault <profile> <vaultPath>')
    .description('Diff a profile against a vault file')
    .option('--json', 'Output raw JSON diff')
    .action((profile, vaultPath, opts) => {
      try {
        const { diff, summary } = compareProfileToVault(profile, vaultPath);
        if (opts.json) {
          console.log(JSON.stringify(diff, null, 2));
        } else {
          console.log(`Comparing profile "${profile}" → vault "${vaultPath}"`);
          console.log(summary || '(no differences)');
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerCompareCommands };
