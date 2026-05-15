const { encryptEnvValues, decryptEnvValues } = require('./envEncryption');
const { readVault, writeVault } = require('../vault/vaultAccess');
const { logAuditEvent } = require('../audit/auditLog');

/**
 * Registers CLI commands for vault-level encryption and decryption.
 */
function registerEncryptionCommands(program) {
  program
    .command('encrypt-vault <vault>')
    .description('Encrypt all values in a vault with a passphrase')
    .requiredOption('-p, --passphrase <passphrase>', 'Passphrase for encryption')
    .action(async (vault, opts) => {
      try {
        const data = await readVault(vault);
        if (!data || Object.keys(data).length === 0) {
          console.log('Vault is empty, nothing to encrypt.');
          return;
        }
        const encrypted = await encryptEnvValues(data, opts.passphrase);
        await writeVault(vault, encrypted);
        await logAuditEvent({ action: 'encrypt-vault', vault });
        console.log(`Vault "${vault}" encrypted successfully (${Object.keys(encrypted).length} keys).`);
      } catch (err) {
        console.error('Encryption failed:', err.message);
        process.exitCode = 1;
      }
    });

  program
    .command('decrypt-vault <vault>')
    .description('Decrypt all values in a vault with a passphrase')
    .requiredOption('-p, --passphrase <passphrase>', 'Passphrase for decryption')
    .action(async (vault, opts) => {
      try {
        const data = await readVault(vault);
        if (!data || Object.keys(data).length === 0) {
          console.log('Vault is empty, nothing to decrypt.');
          return;
        }
        const decrypted = await decryptEnvValues(data, opts.passphrase);
        await writeVault(vault, decrypted);
        await logAuditEvent({ action: 'decrypt-vault', vault });
        console.log(`Vault "${vault}" decrypted successfully (${Object.keys(decrypted).length} keys).`);
      } catch (err) {
        console.error('Decryption failed:', err.message);
        process.exitCode = 1;
      }
    });
}

module.exports = { registerEncryptionCommands };
