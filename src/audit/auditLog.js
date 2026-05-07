const fs = require('fs');
const path = require('path');

const AUDIT_LOG_PATH = path.resolve(process.env.AUDIT_LOG_PATH || '.envault_audit.log');

/**
 * Appends an audit entry to the audit log file.
 * @param {string} action - The action performed (e.g., 'READ', 'WRITE', 'ROTATE', 'SHARE').
 * @param {string} vaultName - The name of the vault involved.
 * @param {string} actor - The user or process performing the action.
 * @param {object} [meta={}] - Optional additional metadata.
 */
function logAuditEvent(action, vaultName, actor, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    vaultName,
    actor,
    ...meta,
  };
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(AUDIT_LOG_PATH, line, 'utf8');
  return entry;
}

/**
 * Reads and parses all audit log entries.
 * @returns {Array<object>} Parsed audit log entries.
 */
function readAuditLog() {
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/**
 * Filters audit log entries by vault name.
 * @param {string} vaultName - The vault name to filter by.
 * @returns {Array<object>} Filtered audit log entries.
 */
function getAuditLogForVault(vaultName) {
  return readAuditLog().filter((entry) => entry.vaultName === vaultName);
}

/**
 * Clears the audit log file. Use with caution.
 */
function clearAuditLog() {
  fs.writeFileSync(AUDIT_LOG_PATH, '', 'utf8');
}

module.exports = { logAuditEvent, readAuditLog, getAuditLogForVault, clearAuditLog };
