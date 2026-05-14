/**
 * envMergeStrategy.js
 * Defines and applies merge strategies when combining env sources.
 * Strategies: 'overwrite', 'preserve', 'prompt-on-conflict'
 */

const STRATEGIES = ['overwrite', 'preserve', 'error-on-conflict'];

/**
 * Validate that a strategy name is supported.
 * @param {string} strategy
 */
function validateStrategy(strategy) {
  if (!STRATEGIES.includes(strategy)) {
    throw new Error(
      `Unknown merge strategy "${strategy}". Valid options: ${STRATEGIES.join(', ')}`
    );
  }
}

/**
 * Merge two parsed env objects using the given strategy.
 * @param {Record<string,string>} base   - The existing env.
 * @param {Record<string,string>} incoming - The incoming env to merge.
 * @param {string} strategy - 'overwrite' | 'preserve' | 'error-on-conflict'
 * @returns {{ merged: Record<string,string>, conflicts: string[] }}
 */
function mergeWithStrategy(base, incoming, strategy = 'overwrite') {
  validateStrategy(strategy);

  const merged = { ...base };
  const conflicts = [];

  for (const [key, value] of Object.entries(incoming)) {
    const exists = Object.prototype.hasOwnProperty.call(base, key);

    if (!exists) {
      merged[key] = value;
      continue;
    }

    if (base[key] === value) {
      // No real conflict — values are identical
      continue;
    }

    conflicts.push(key);

    if (strategy === 'overwrite') {
      merged[key] = value;
    } else if (strategy === 'preserve') {
      // Keep base value — do nothing
    } else if (strategy === 'error-on-conflict') {
      throw new Error(
        `Merge conflict on key "${key}": base="${base[key]}", incoming="${value}"`
      );
    }
  }

  return { merged, conflicts };
}

/**
 * List all available merge strategies.
 * @returns {string[]}
 */
function listStrategies() {
  return [...STRATEGIES];
}

module.exports = { validateStrategy, mergeWithStrategy, listStrategies };
