/**
 * accessCommands.js — CLI commands for role-based vault access control
 */

const { grantAccess, revokeAccess, getRole, listAccess, ROLES } = require('./envAccess');

function registerAccessCommands(program) {
  const access = program.command('access').description('Manage vault access control');

  access
    .command('grant <vault> <user> <role>')
    .description(`Grant a user a role on a vault. Roles: ${ROLES.join(', ')}`)
    .action((vault, user, role) => {
      try {
        const result = grantAccess(vault, user, role);
        console.log(`Granted '${result.role}' to '${result.user}' on vault '${result.vault}'`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  access
    .command('revoke <vault> <user>')
    .description('Revoke a user\'s access to a vault')
    .action((vault, user) => {
      try {
        revokeAccess(vault, user);
        console.log(`Revoked access for '${user}' on vault '${vault}'`);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  access
    .command('role <vault> <user>')
    .description('Show the role of a user on a vault')
    .action((vault, user) => {
      const role = getRole(vault, user);
      if (role) {
        console.log(`${user}: ${role}`);
      } else {
        console.log(`No access rules found for '${user}' on vault '${vault}'`);
      }
    });

  access
    .command('list <vault>')
    .description('List all access rules for a vault')
    .action((vault) => {
      const rules = listAccess(vault);
      const entries = Object.entries(rules);
      if (entries.length === 0) {
        console.log(`No access rules defined for vault '${vault}'`);
      } else {
        entries.forEach(([user, role]) => console.log(`  ${user}: ${role}`));
      }
    });
}

module.exports = { registerAccessCommands };
