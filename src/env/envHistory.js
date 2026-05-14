const fs = require('fs');
const path = require('path');

const HISTORY_DIR = path.resolve('.envault', 'history');
const MAX_HISTORY = 50;

function ensureHistoryDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function historyPath(vaultName) {
  return path.join(HISTORY_DIR, `${vaultName}.history.json`);
}

function loadHistory(vaultName) {
  const p = historyPath(vaultName);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveHistory(vaultName, entries) {
  ensureHistoryDir();
  fs.writeFileSync(historyPath(vaultName), JSON.stringify(entries, null, 2));
}

function recordChange(vaultName, { key, oldValue, newValue, action, user = 'unknown' }) {
  const history = loadHistory(vaultName);
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    key,
    action,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    user
  };
  history.unshift(entry);
  const trimmed = history.slice(0, MAX_HISTORY);
  saveHistory(vaultName, trimmed);
  return entry;
}

function getHistory(vaultName, { limit = 20, key } = {}) {
  const history = loadHistory(vaultName);
  const filtered = key ? history.filter(e => e.key === key) : history;
  return filtered.slice(0, limit);
}

function clearHistory(vaultName) {
  saveHistory(vaultName, []);
}

function undoLast(vaultName) {
  const history = loadHistory(vaultName);
  if (history.length === 0) return null;
  const [last, ...rest] = history;
  saveHistory(vaultName, rest);
  return last;
}

module.exports = { ensureHistoryDir, historyPath, recordChange, getHistory, clearHistory, undoLast };
