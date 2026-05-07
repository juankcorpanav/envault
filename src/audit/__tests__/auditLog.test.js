const fs = require('fs');
const path = require('path');

// Use a temp log path for tests
const TEST_LOG_PATH = path.resolve('.envault_audit_test.log');
process.env.AUDIT_LOG_PATH = TEST_LOG_PATH;

const {
  logAuditEvent,
  readAuditLog,
  getAuditLogForVault,
  clearAuditLog,
} = require('../auditLog');

beforeEach(() => {
  if (fs.existsSync(TEST_LOG_PATH)) {
    fs.unlinkSync(TEST_LOG_PATH);
  }
});

afterAll(() => {
  if (fs.existsSync(TEST_LOG_PATH)) {
    fs.unlinkSync(TEST_LOG_PATH);
  }
});

describe('logAuditEvent', () => {
  it('should write a JSON entry to the audit log', () => {
    const entry = logAuditEvent('WRITE', 'production', 'alice');
    expect(entry.action).toBe('WRITE');
    expect(entry.vaultName).toBe('production');
    expect(entry.actor).toBe('alice');
    expect(entry.timestamp).toBeDefined();
    expect(fs.existsSync(TEST_LOG_PATH)).toBe(true);
  });

  it('should include optional meta fields in the entry', () => {
    const entry = logAuditEvent('ROTATE', 'staging', 'bob', { key: 'DB_PASS' });
    expect(entry.key).toBe('DB_PASS');
  });
});

describe('readAuditLog', () => {
  it('should return an empty array when log does not exist', () => {
    const entries = readAuditLog();
    expect(entries).toEqual([]);
  });

  it('should return all logged entries', () => {
    logAuditEvent('READ', 'production', 'alice');
    logAuditEvent('WRITE', 'staging', 'bob');
    const entries = readAuditLog();
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('READ');
    expect(entries[1].action).toBe('WRITE');
  });
});

describe('getAuditLogForVault', () => {
  it('should return only entries matching the vault name', () => {
    logAuditEvent('READ', 'production', 'alice');
    logAuditEvent('WRITE', 'staging', 'bob');
    logAuditEvent('ROTATE', 'production', 'carol');
    const entries = getAuditLogForVault('production');
    expect(entries).toHaveLength(2);
    entries.forEach((e) => expect(e.vaultName).toBe('production'));
  });
});

describe('clearAuditLog', () => {
  it('should empty the audit log file', () => {
    logAuditEvent('READ', 'production', 'alice');
    clearAuditLog();
    const entries = readAuditLog();
    expect(entries).toHaveLength(0);
  });
});
