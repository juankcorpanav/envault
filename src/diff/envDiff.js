/**
 * envDiff.js
 * Compares two parsed env objects and returns a structured diff.
 */

/**
 * Compute the diff between two env objects.
 * @param {Object} oldEnv - The previous env key-value map.
 * @param {Object} newEnv - The updated env key-value map.
 * @returns {Object} diff - { added, removed, changed, unchanged }
 */
function diffEnv(oldEnv, newEnv) {
  const added = {};
  const removed = {};
  const changed = {};
  const unchanged = {};

  const allKeys = new Set([...Object.keys(oldEnv), ...Object.keys(newEnv)]);

  for (const key of allKeys) {
    const inOld = Object.prototype.hasOwnProperty.call(oldEnv, key);
    const inNew = Object.prototype.hasOwnProperty.call(newEnv, key);

    if (inOld && !inNew) {
      removed[key] = oldEnv[key];
    } else if (!inOld && inNew) {
      added[key] = newEnv[key];
    } else if (oldEnv[key] !== newEnv[key]) {
      changed[key] = { from: oldEnv[key], to: newEnv[key] };
    } else {
      unchanged[key] = oldEnv[key];
    }
  }

  return { added, removed, changed, unchanged };
}

/**
 * Format a diff object into a human-readable string.
 * @param {Object} diff - Output from diffEnv.
 * @returns {string}
 */
function formatDiff(diff) {
  const lines = [];

  for (const key of Object.keys(diff.added)) {
    lines.push(`+ ${key}=${diff.added[key]}`);
  }
  for (const key of Object.keys(diff.removed)) {
    lines.push(`- ${key}=${diff.removed[key]}`);
  }
  for (const key of Object.keys(diff.changed)) {
    lines.push(`~ ${key}: "${diff.changed[key].from}" → "${diff.changed[key].to}"`);
  }

  return lines.length > 0 ? lines.join('\n') : '(no changes)';
}

/**
 * Returns true if there are any differences between the two env objects.
 * @param {Object} diff - Output from diffEnv.
 * @returns {boolean}
 */
function hasDiff(diff) {
  return (
    Object.keys(diff.added).length > 0 ||
    Object.keys(diff.removed).length > 0 ||
    Object.keys(diff.changed).length > 0
  );
}

module.exports = { diffEnv, formatDiff, hasDiff };
