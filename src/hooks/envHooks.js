/**
 * envHooks.js — Lifecycle hooks for vault read/write/rotate events
 * Allows registering pre/post hooks to run custom logic around vault operations.
 */

const hooks = {
  preRead: [],
  postRead: [],
  preWrite: [],
  postWrite: [],
  preRotate: [],
  postRotate: [],
};

/**
 * Register a hook for a given lifecycle event.
 * @param {string} event - One of: preRead, postRead, preWrite, postWrite, preRotate, postRotate
 * @param {Function} fn - Async or sync function to call. Receives (context) object.
 */
function registerHook(event, fn) {
  if (!hooks[event]) throw new Error(`Unknown hook event: "${event}"`);
  if (typeof fn !== 'function') throw new TypeError('Hook must be a function');
  hooks[event].push(fn);
}

/**
 * Unregister a previously registered hook.
 * @param {string} event
 * @param {Function} fn
 */
function unregisterHook(event, fn) {
  if (!hooks[event]) throw new Error(`Unknown hook event: "${event}"`);
  hooks[event] = hooks[event].filter((h) => h !== fn);
}

/**
 * Run all hooks registered for a given event sequentially.
 * @param {string} event
 * @param {object} context - Data passed to each hook
 * @returns {Promise<object>} - Potentially mutated context
 */
async function runHooks(event, context) {
  if (!hooks[event]) throw new Error(`Unknown hook event: "${event}"`);
  let ctx = { ...context };
  for (const fn of hooks[event]) {
    const result = await fn(ctx);
    if (result && typeof result === 'object') {
      ctx = { ...ctx, ...result };
    }
  }
  return ctx;
}

/**
 * Clear all hooks for a given event, or all events if none specified.
 * @param {string} [event]
 */
function clearHooks(event) {
  if (event) {
    if (!hooks[event]) throw new Error(`Unknown hook event: "${event}"`);
    hooks[event] = [];
  } else {
    for (const key of Object.keys(hooks)) {
      hooks[key] = [];
    }
  }
}

/**
 * List all registered hooks.
 * @returns {object}
 */
function listHooks() {
  return Object.fromEntries(
    Object.entries(hooks).map(([event, fns]) => [event, fns.length])
  );
}

module.exports = { registerHook, unregisterHook, runHooks, clearHooks, listHooks };
