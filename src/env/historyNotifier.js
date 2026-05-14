const { recordChange } = require('./envHistory');

/**
 * Creates a notifier that automatically records vault changes to history.
 * Designed to be composed with watchNotifier-style hooks.
 */
function historyNotifier(vaultName, { user = 'unknown' } = {}) {
  return function notify(event) {
    const { type, key, oldValue, newValue } = event;
    if (!key) return;

    const actionMap = {
      set: 'set',
      update: 'set',
      delete: 'delete',
      rotate: 'rotate'
    };

    const action = actionMap[type] || type;
    recordChange(vaultName, { key, oldValue, newValue, action, user });
  };
}

/**
 * Wraps a vault write function to automatically record history.
 */
function withHistory(vaultName, writeFn, { user = 'unknown' } = {}) {
  return function wrappedWrite(key, newValue, oldValue) {
    const result = writeFn(key, newValue, oldValue);
    recordChange(vaultName, {
      key,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      action: newValue === undefined ? 'delete' : 'set',
      user
    });
    return result;
  };
}

/**
 * Summarises history entries for display.
 */
function formatHistoryEntry(entry) {
  const parts = [`[${entry.timestamp}]`, entry.action.toUpperCase(), entry.key];
  if (entry.user && entry.user !== 'unknown') parts.push(`by ${entry.user}`);
  if (entry.oldValue !== null && entry.newValue !== null) {
    parts.push(`(${entry.oldValue} → ${entry.newValue})`);
  } else if (entry.newValue !== null) {
    parts.push(`(added: ${entry.newValue})`);
  } else if (entry.oldValue !== null) {
    parts.push(`(removed: ${entry.oldValue})`);
  }
  return parts.join(' ');
}

module.exports = { historyNotifier, withHistory, formatHistoryEntry };
