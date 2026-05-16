// envSnapshot2Env.js — Convert between env objects and snapshot-compatible formats

const { parseEnv, serializeEnv } = require('../secrets/envParser');
const { createSnapshot, loadSnapshot } = require('../snapshot/envSnapshot');
const { computeChecksum } = require('./envChecksum');

/**
 * Promote a plain env object into a named snapshot.
 * @param {string} vaultName
 * @param {Record<string, string>} envObj
 * @param {string} [label]
 * @returns {Promise<{snapshotId: string, checksum: string}>}
 */
async function promoteEnvToSnapshot(vaultName, envObj, label) {
  const serialized = serializeEnv(envObj);
  const checksum = computeChecksum(serialized);
  const snapshotId = await createSnapshot(vaultName, envObj, { label, checksum });
  return { snapshotId, checksum };
}

/**
 * Demote a snapshot back into a plain env object.
 * @param {string} vaultName
 * @param {string} snapshotId
 * @returns {Promise<Record<string, string>>}
 */
async function demoteSnapshotToEnv(vaultName, snapshotId) {
  const snapshot = await loadSnapshot(vaultName, snapshotId);
  if (!snapshot || !snapshot.data) {
    throw new Error(`Snapshot '${snapshotId}' not found for vault '${vaultName}'.`);
  }
  return typeof snapshot.data === 'string' ? parseEnv(snapshot.data) : snapshot.data;
}

/**
 * Serialize an env object to a portable string payload.
 * @param {Record<string, string>} envObj
 * @returns {string}
 */
function serializeForTransport(envObj) {
  return Buffer.from(serializeEnv(envObj)).toString('base64');
}

/**
 * Deserialize a portable string payload back to an env object.
 * @param {string} payload
 * @returns {Record<string, string>}
 */
function deserializeFromTransport(payload) {
  const raw = Buffer.from(payload, 'base64').toString('utf8');
  return parseEnv(raw);
}

module.exports = {
  promoteEnvToSnapshot,
  demoteSnapshotToEnv,
  serializeForTransport,
  deserializeFromTransport,
};
