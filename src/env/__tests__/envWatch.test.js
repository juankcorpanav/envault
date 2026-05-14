const fs = require('fs');
const path = require('path');
const os = require('os');
const { watchEnvFile, unwatchEnvFile, listWatched, clearWatchers } = require('../envWatch');

jest.mock('../../../src/audit/auditLog', () => ({ logAuditEvent: jest.fn() }), { virtual: true });
jest.mock('../../audit/auditLog', () => ({ logAuditEvent: jest.fn() }));

let tmpDir;
let tmpFile;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envwatch-'));
  tmpFile = path.join(tmpDir, '.env');
  fs.writeFileSync(tmpFile, 'KEY=initial\n');
  clearWatchers();
});

afterEach(() => {
  clearWatchers();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('watchEnvFile registers a watcher', () => {
  watchEnvFile('test-vault', tmpFile, jest.fn());
  const watched = listWatched();
  expect(watched).toHaveLength(1);
  expect(watched[0].vaultName).toBe('test-vault');
  expect(watched[0].filePath).toBe(tmpFile);
});

test('watchEnvFile throws if vault already watched', () => {
  watchEnvFile('dupe-vault', tmpFile, jest.fn());
  expect(() => watchEnvFile('dupe-vault', tmpFile, jest.fn())).toThrow(
    'Already watching vault: dupe-vault'
  );
});

test('watchEnvFile throws if file does not exist', () => {
  const missingFile = path.join(tmpDir, 'nonexistent.env');
  expect(() => watchEnvFile('missing-vault', missingFile, jest.fn())).toThrow();
});

test('unwatchEnvFile removes watcher and returns true', () => {
  watchEnvFile('rm-vault', tmpFile, jest.fn());
  const result = unwatchEnvFile('rm-vault');
  expect(result).toBe(true);
  expect(listWatched()).toHaveLength(0);
});

test('unwatchEnvFile returns false for unknown vault', () => {
  const result = unwatchEnvFile('ghost-vault');
  expect(result).toBe(false);
});

test('listWatched returns empty array when no watchers', () => {
  expect(listWatched()).toEqual([]);
});

test('clearWatchers removes all watchers', () => {
  const file2 = path.join(tmpDir, '.env2');
  fs.writeFileSync(file2, 'A=1\n');
  watchEnvFile('v1', tmpFile, jest.fn());
  watchEnvFile('v2', file2, jest.fn());
  expect(listWatched()).toHaveLength(2);
  clearWatchers();
  expect(listWatched()).toHaveLength(0);
});

test('onChange callback is invoked on file change', (done) => {
  const onChange = jest.fn((vaultName, oldEnv, newEnv) => {
    expect(vaultName).toBe('cb-vault');
    expect(oldEnv).toEqual({ KEY: 'initial' });
    expect(newEnv).toEqual({ KEY: 'updated' });
    done();
  });
  watchEnvFile('cb-vault', tmpFile, onChange);
  setTimeout(() => {
    fs.writeFileSync(tmpFile, 'KEY=updated\n');
  }, 50);
}, 3000);
