/**
 * envLifecycle.js
 * Manage lifecycle hooks for env keys: onCreate, onUpdate, onDelete
 */

const path = require('path');
const fs = require('fs');

const LIFECYCLE_DIR = path.resolve('.envault', 'lifecycle');
const LIFECYCLE_FILE = path.join(LIFECYCLE_DIR, 'hooks.json');

function ensureLifecycleDir() {
  if (!fs.existsSync(LIFECYCLE_DIR)) {
    fs.mkdirSync(LIFECYCLE_DIR, { recursive: true });
  }
}

function loadLifecycleHooks() {
  ensureLifecycleDir();
  if (!fs.existsSync(LIFECYCLE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(LIFECYCLE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveLifecycleHooks(hooks) {
  ensureLifecycleDir();
  fs.writeFileSync(LIFECYCLE_FILE, JSON.stringify(hooks, null, 2), 'utf8');
}

/**
 * Register a lifecycle hook for a key.
 * @param {string} key - The env key
 * @param {'onCreate'|'onUpdate'|'onDelete'} event - Lifecycle event
 * @param {string} command - Shell command or label to associate
 */
function registerLifecycleHook(key, event, command) {
  const validEvents = ['onCreate', 'onUpdate', 'onDelete'];
  if (!validEvents.includes(event)) {
    throw new Error(`Invalid lifecycle event: ${event}. Must be one of ${validEvents.join(', ')}`);
  }
  const hooks = loadLifecycleHooks();
  if (!hooks[key]) hooks[key] = {};
  hooks[key][event] = command;
  saveLifecycleHooks(hooks);
  return hooks[key];
}

function removeLifecycleHook(key, event) {
  const hooks = loadLifecycleHooks();
  if (hooks[key]) {
    delete hooks[key][event];
    if (Object.keys(hooks[key]).length === 0) delete hooks[key];
    saveLifecycleHooks(hooks);
  }
}

function getLifecycleHooks(key) {
  const hooks = loadLifecycleHooks();
  return hooks[key] || {};
}

function listAllLifecycleHooks() {
  return loadLifecycleHooks();
}

function triggerLifecycleHook(key, event, context = {}) {
  const hooks = loadLifecycleHooks();
  const command = hooks[key]?.[event];
  if (!command) return null;
  return { key, event, command, context, triggeredAt: new Date().toISOString() };
}

module.exports = {
  ensureLifecycleDir,
  loadLifecycleHooks,
  saveLifecycleHooks,
  registerLifecycleHook,
  removeLifecycleHook,
  getLifecycleHooks,
  listAllLifecycleHooks,
  triggerLifecycleHook,
};
