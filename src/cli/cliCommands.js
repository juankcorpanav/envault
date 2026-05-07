const { readVault, writeVault, updateVault, deleteVaultKey } = require('../vault/vaultAccess');
const { listVaults } = require('../vault/vaultManager');
const { rotateSecret } = require('../secrets/secretRotation');
const { encryptEnv, decryptEnv } = require('../sharing/teamShare');
const { logAuditEvent } = require('../audit/auditLog');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

async function cmdGet(vaultName, key) {
  const vault = await readVault(vaultName);
  if (!vault) throw new Error(`Vault "${vaultName}" not found.`);
  if (key) {
    const value = vault[key];
    if (value === undefined) throw new Error(`Key "${key}" not found in vault "${vaultName}".`);
    return { [key]: value };
  }
  return vault;
}

async function cmdSet(vaultName, key, value) {
  await updateVault(vaultName, { [key]: value });
  await logAuditEvent({ action: 'SET', vault: vaultName, key });
  return { success: true, vault: vaultName, key };
}

async function cmdDelete(vaultName, key) {
  await deleteVaultKey(vaultName, key);
  await logAuditEvent({ action: 'DELETE', vault: vaultName, key });
  return { success: true, vault: vaultName, key };
}

async function cmdList() {
  const vaults = await listVaults();
  return { vaults };
}

async function cmdRotate(vaultName, key) {
  const vault = await readVault(vaultName);
  if (!vault) throw new Error(`Vault "${vaultName}" not found.`);
  const oldValue = vault[key];
  const newValue = await rotateSecret(vaultName, key, oldValue);
  await updateVault(vaultName, { [key]: newValue });
  await logAuditEvent({ action: 'ROTATE', vault: vaultName, key });
  return { success: true, vault: vaultName, key, newValue };
}

async function cmdExport(vaultName, passphrase) {
  const vault = await readVault(vaultName);
  if (!vault) throw new Error(`Vault "${vaultName}" not found.`);
  const envString = serializeEnv(vault);
  const encrypted = await encryptEnv(envString, passphrase);
  await logAuditEvent({ action: 'EXPORT', vault: vaultName });
  return encrypted;
}

async function cmdImport(vaultName, encryptedPayload, passphrase) {
  const envString = await decryptEnv(encryptedPayload, passphrase);
  const parsed = parseEnv(envString);
  await writeVault(vaultName, parsed);
  await logAuditEvent({ action: 'IMPORT', vault: vaultName });
  return { success: true, vault: vaultName, keys: Object.keys(parsed) };
}

module.exports = { cmdGet, cmdSet, cmdDelete, cmdList, cmdRotate, cmdExport, cmdImport };
