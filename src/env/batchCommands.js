const { applyBatch, listBatchOps } = require('./envBatch');

/**
 * Register batch operation CLI commands.
 * @param {import('commander').Command} program
 */
function registerBatchCommands(program) {
  const batch = program.command('batch').description('Apply bulk operations to a vault');

  batch
    .command('apply <vaultPath> <opsJson>')
    .description('Apply a JSON array of batch operations to a vault')
    .option('--dry-run', 'Preview changes without writing to vault')
    .action(async (vaultPath, opsJson, opts) => {
      let ops;
      try {
        ops = JSON.parse(opsJson);
      } catch {
        console.error('Error: opsJson must be a valid JSON array');
        process.exitCode = 1;
        return;
      }

      try {
        const { applied, skipped, results } = await applyBatch(vaultPath, ops, { dryRun: opts.dryRun });
        if (opts.dryRun) console.log('[dry-run] No changes written.');
        console.log(`Applied: ${applied}, Skipped: ${skipped}`);
        results.forEach(r => {
          const tag = r.status === 'applied' ? '✔' : '✖';
          const detail = r.reason ? ` (${r.reason})` : '';
          console.log(`  ${tag} [${r.op.type}] ${r.op.key}${detail}`);
        });
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  batch
    .command('ops')
    .description('List supported batch operation types')
    .action(() => {
      console.log('Supported batch operations:');
      listBatchOps().forEach(op => console.log(`  - ${op}`));
    });
}

module.exports = { registerBatchCommands };
