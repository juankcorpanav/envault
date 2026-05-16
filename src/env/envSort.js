/**
 * envSort.js — Sort .env keys alphabetically, by group prefix, or by custom order.
 */

/**
 * Sort env entries alphabetically by key.
 * @param {Record<string,string>} env
 * @returns {Record<string,string>}
 */
function sortAlphabetical(env) {
  return Object.fromEntries(
    Object.entries(env).sort(([a], [b]) => a.localeCompare(b))
  );
}

/**
 * Sort env entries by prefix groups (e.g. DB_, AWS_, APP_),
 * then alphabetically within each group.
 * @param {Record<string,string>} env
 * @returns {Record<string,string>}
 */
function sortByPrefix(env) {
  const entries = Object.entries(env);
  entries.sort(([a], [b]) => {
    const prefixA = a.includes('_') ? a.split('_')[0] : '';
    const prefixB = b.includes('_') ? b.split('_')[0] : '';
    const cmp = prefixA.localeCompare(prefixB);
    return cmp !== 0 ? cmp : a.localeCompare(b);
  });
  return Object.fromEntries(entries);
}

/**
 * Sort env entries by a provided key order array.
 * Keys not in the order array are appended at the end, alphabetically.
 * @param {Record<string,string>} env
 * @param {string[]} order
 * @returns {Record<string,string>}
 */
function sortByCustomOrder(env, order) {
  if (!Array.isArray(order) || order.length === 0) {
    throw new Error('Custom order must be a non-empty array of keys.');
  }
  const orderMap = new Map(order.map((k, i) => [k, i]));
  const entries = Object.entries(env);
  entries.sort(([a], [b]) => {
    const ia = orderMap.has(a) ? orderMap.get(a) : Infinity;
    const ib = orderMap.has(b) ? orderMap.get(b) : Infinity;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });
  return Object.fromEntries(entries);
}

/**
 * List available sort strategies.
 * @returns {string[]}
 */
function listSortStrategies() {
  return ['alphabetical', 'prefix', 'custom'];
}

/**
 * Sort env using a named strategy.
 * @param {Record<string,string>} env
 * @param {string} strategy
 * @param {{ order?: string[] }} [options]
 * @returns {Record<string,string>}
 */
function sortEnv(env, strategy = 'alphabetical', options = {}) {
  switch (strategy) {
    case 'alphabetical':
      return sortAlphabetical(env);
    case 'prefix':
      return sortByPrefix(env);
    case 'custom':
      return sortByCustomOrder(env, options.order || []);
    default:
      throw new Error(`Unknown sort strategy: "${strategy}". Use one of: ${listSortStrategies().join(', ')}`);
  }
}

module.exports = {
  sortAlphabetical,
  sortByPrefix,
  sortByCustomOrder,
  sortEnv,
  listSortStrategies,
};
