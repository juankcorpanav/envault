// snapshotSyncCommands.js — CLI commands for promoting/demoting env <-> snapshot

const {
  promoteEnvToSnapshot,
  demoteSnapshotToEnv,
  serializeForTransport,
  deserializeFromTransport,
} = require('./envSnapshot2Env');
const { readVault, writeVault } = require('../vault/vaultAccess');

/**
 * Register snapshot-sync commands onto a commander program.
 * @param {import('commander').Command} program
 */
function registerSnapshotSyncCommands(program) {
  program
    .command('snapshot-sync promote <vault> [label]')
    .description('Promote current vault env to a snapshot')
    .action(async (vault, label) => {
      try {
        const envObj = await readVault(vault);
        const { snapshotId, checksum } = await promoteEnvToSnapshot(vault, envObj, label);
        console.log(`Promoted vault '${vault}' to snapshot '${snapshotId}' (checksum: ${checksum}).`);
      } catch (err) {
        console.error('promote error:', err.message);
        process.exitCode = 1;
      }
    });

  program
    .command('snapshot-sync demote <vault> <snapshotId>')
    .description('Restore vault from a snapshot')
    .action(async (vault, snapshotId) => {
      try {
        const envObj = await demoteSnapshotToEnv(vault, snapshotId);
        await writeVault(vault, envObj);
        console.log(`Vault '${vault}' restored from snapshot '${snapshotId}'.`);
      } catch (err) {
        console.error('demote error:', err.message);
        process.exitCode = 1;
      }
    });

  program
    .command('snapshot-sync export <vault>')
    .description('Export vault env as a base64 transport payload')
    .action(async (vault) => {
      try {
        const envObj = await readVault(vault);
        console.log(serializeForTransport(envObj));
      } catch (err) {
        console.error('export error:', err.message);
        process.exitCode = 1;
      }
    });

  program
    .command('snapshot-sync import <vault> <payload>')
    .description('Import vault env from a base64 transport payload')
    .action(async (vault, payload) => {
      try {
        const envObj = deserializeFromTransport(payload);
        await writeVault(vault, envObj);
        console.log(`Vault '${vault}' imported from transport payload.`);
      } catch (err) {
        console.error('import error:', err.message);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerSnapshotSyncCommands };
