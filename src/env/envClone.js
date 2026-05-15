const { readVault, writeVault } = require('../vault/vaultAccess');
const { isLocked } = require('./envLock');
const { logAuditEvent } = require('../audit/auditLog');

/**
 * Clone an existing vault (or profile env) to a new target vault.
 * Optionally filter keys by a prefix or list of keys.
 */
async function cloneVault(sourceVault, targetVault, options = {}) {
  if (!sourceVault || !targetVault) {
    throw new Error('Both sourceVault and targetVault names are required.');
  }

  if (sourceVault === targetVault) {
    throw new Error('Source and target vault names must be different.');
  }

  if (await isLocked(sourceVault)) {
    throw new Error(`Source vault "${sourceVault}" is locked.`);
  }

  if (await isLocked(targetVault)) {
    throw new Error(`Target vault "${targetVault}" is locked.`);
  }

  const source = await readVault(sourceVault);
  let entries = { ...source };

  if (options.keys && Array.isArray(options.keys) && options.keys.length > 0) {
    entries = Object.fromEntries(
      Object.entries(entries).filter(([k]) => options.keys.includes(k))
    );
  }

  if (options.prefix) {
    entries = Object.fromEntries(
      Object.entries(entries).filter(([k]) => k.startsWith(options.prefix))
    );
  }

  if (!options.overwrite) {
    let existing = {};
    try {
      existing = await readVault(targetVault);
    } catch (_) {
      // target may not exist yet
    }
    entries = Object.fromEntries(
      Object.entries(entries).filter(([k]) => !(k in existing))
    );
  }

  await writeVault(targetVault, entries);

  await logAuditEvent({
    action: 'clone_vault',
    source: sourceVault,
    target: targetVault,
    keyCount: Object.keys(entries).length,
    options,
  });

  return { cloned: Object.keys(entries) };
}

/**
 * Preview what would be cloned without writing anything.
 */
async function previewClone(sourceVault, targetVault, options = {}) {
  if (await isLocked(sourceVault)) {
    throw new Error(`Source vault "${sourceVault}" is locked.`);
  }

  const source = await readVault(sourceVault);
  let entries = { ...source };

  if (options.keys && Array.isArray(options.keys) && options.keys.length > 0) {
    entries = Object.fromEntries(
      Object.entries(entries).filter(([k]) => options.keys.includes(k))
    );
  }

  if (options.prefix) {
    entries = Object.fromEntries(
      Object.entries(entries).filter(([k]) => k.startsWith(options.prefix))
    );
  }

  let existing = {};
  if (!options.overwrite) {
    try {
      existing = await readVault(targetVault);
    } catch (_) {}
  }

  const willClone = Object.keys(entries).filter((k) => !(k in existing));
  const willSkip = Object.keys(entries).filter((k) => k in existing);

  return { willClone, willSkip };
}

module.exports = { cloneVault, previewClone };
