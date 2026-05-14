const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-history-'));
  jest.resetModules();
  jest.doMock('path', () => ({
    ...jest.requireActual('path'),
    resolve: (...args) => {
      if (args[0] === '.envault') return path.join(tmpDir, ...args);
      return jest.requireActual('path').resolve(...args);
    }
  }));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function freshModule() {
  return require('../envHistory');
}

test('recordChange stores an entry', () => {
  const { recordChange, getHistory } = freshModule();
  recordChange('myVault', { key: 'API_KEY', oldValue: null, newValue: 'abc123', action: 'set' });
  const history = getHistory('myVault');
  expect(history).toHaveLength(1);
  expect(history[0].key).toBe('API_KEY');
  expect(history[0].action).toBe('set');
  expect(history[0].newValue).toBe('abc123');
});

test('getHistory filters by key', () => {
  const { recordChange, getHistory } = freshModule();
  recordChange('myVault', { key: 'API_KEY', oldValue: null, newValue: 'v1', action: 'set' });
  recordChange('myVault', { key: 'DB_URL', oldValue: null, newValue: 'pg://...', action: 'set' });
  const filtered = getHistory('myVault', { key: 'API_KEY' });
  expect(filtered).toHaveLength(1);
  expect(filtered[0].key).toBe('API_KEY');
});

test('getHistory respects limit', () => {
  const { recordChange, getHistory } = freshModule();
  for (let i = 0; i < 10; i++) {
    recordChange('myVault', { key: `K${i}`, newValue: `v${i}`, action: 'set' });
  }
  const history = getHistory('myVault', { limit: 3 });
  expect(history).toHaveLength(3);
});

test('clearHistory empties the log', () => {
  const { recordChange, getHistory, clearHistory } = freshModule();
  recordChange('myVault', { key: 'X', newValue: '1', action: 'set' });
  clearHistory('myVault');
  expect(getHistory('myVault')).toHaveLength(0);
});

test('undoLast removes and returns the most recent entry', () => {
  const { recordChange, getHistory, undoLast } = freshModule();
  recordChange('myVault', { key: 'A', newValue: '1', action: 'set' });
  recordChange('myVault', { key: 'B', newValue: '2', action: 'set' });
  const last = undoLast('myVault');
  expect(last.key).toBe('B');
  expect(getHistory('myVault')).toHaveLength(1);
  expect(getHistory('myVault')[0].key).toBe('A');
});

test('undoLast returns null when history is empty', () => {
  const { undoLast } = freshModule();
  expect(undoLast('emptyVault')).toBeNull();
});

test('history is capped at MAX_HISTORY entries', () => {
  const { recordChange, getHistory } = freshModule();
  for (let i = 0; i < 60; i++) {
    recordChange('myVault', { key: `K${i}`, newValue: `v${i}`, action: 'set' });
  }
  const history = getHistory('myVault', { limit: 100 });
  expect(history.length).toBeLessThanOrEqual(50);
});
