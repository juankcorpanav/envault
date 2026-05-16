const { addAlertRule, removeAlertRule, listAlertRules, evaluateAlertRules } = require('./envAlertRules');
const { readVault } = require('../vault/vaultAccess');

function registerAlertCommands(program) {
  const alert = program.command('alert').description('Manage env alert rules');

  alert
    .command('add <vault> <id> <condition> <message>')
    .option('--severity <level>', 'Alert severity: info|warn|error', 'warn')
    .description('Add an alert rule to a vault')
    .action((vault, id, condition, message, opts) => {
      try {
        const rule = addAlertRule(vault, { id, condition, message, severity: opts.severity });
        console.log(`Alert rule '${rule.id}' added to vault '${vault}'`);
      } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
      }
    });

  alert
    .command('remove <vault> <id>')
    .description('Remove an alert rule from a vault')
    .action((vault, id) => {
      try {
        removeAlertRule(vault, id);
        console.log(`Alert rule '${id}' removed from vault '${vault}'`);
      } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
      }
    });

  alert
    .command('list <vault>')
    .description('List all alert rules for a vault')
    .action((vault) => {
      const rules = listAlertRules(vault);
      if (!rules.length) {
        console.log(`No alert rules defined for vault '${vault}'`);
        return;
      }
      rules.forEach(r => {
        console.log(`[${r.severity}] ${r.id}: ${r.message}`);
        console.log(`  condition: ${r.condition}`);
      });
    });

  alert
    .command('check <vault>')
    .description('Evaluate alert rules against current vault contents')
    .action((vault) => {
      try {
        const env = readVault(vault);
        const triggered = evaluateAlertRules(vault, env);
        if (!triggered.length) {
          console.log('All clear — no alerts triggered.');
        } else {
          triggered.forEach(t => console.warn(`[${t.severity.toUpperCase()}] ${t.id}: ${t.message}`));
          process.exit(2);
        }
      } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
      }
    });
}

module.exports = { registerAlertCommands };
