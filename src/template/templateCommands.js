/**
 * templateCommands.js
 * CLI command handlers for env template operations.
 */

const fs = require('fs');
const path = require('path');
const { loadTemplate, validateAgainstTemplate, generateFromTemplate } = require('./envTemplate');
const { parseEnv } = require('../secrets/envParser');
const { logAuditEvent } = require('../audit/auditLog');

/**
 * Register template-related commands on a commander program.
 * @param {import('commander').Command} program
 */
function registerTemplateCommands(program) {
  const tmpl = program.command('template').description('Manage .env templates');

  tmpl
    .command('validate <templateFile> <envFile>')
    .description('Validate an .env file against a template')
    .action((templateFile, envFile) => {
      try {
        const entries = loadTemplate(templateFile);
        const envContent = fs.readFileSync(path.resolve(envFile), 'utf8');
        const envObj = parseEnv(envContent);
        const { valid, missing, withDefaults } = validateAgainstTemplate(entries, envObj);

        if (valid) {
          console.log('✅ Env file is valid against template.');
          if (Object.keys(withDefaults).length > Object.keys(envObj).length) {
            console.log('ℹ️  Defaults were applied for some keys.');
          }
        } else {
          console.error(`❌ Missing required keys: ${missing.join(', ')}`);
          process.exitCode = 1;
        }

        logAuditEvent({ action: 'template:validate', templateFile, envFile, valid, missing });
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });

  tmpl
    .command('generate <templateFile> [outputFile]')
    .description('Generate a blank .env from a template with defaults filled in')
    .action((templateFile, outputFile) => {
      try {
        const entries = loadTemplate(templateFile);
        const content = generateFromTemplate(entries);

        if (outputFile) {
          fs.writeFileSync(path.resolve(outputFile), content, 'utf8');
          console.log(`✅ Generated ${outputFile}`);
          logAuditEvent({ action: 'template:generate', templateFile, outputFile });
        } else {
          process.stdout.write(content);
        }
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerTemplateCommands };
