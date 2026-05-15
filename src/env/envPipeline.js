/**
 * envPipeline.js
 * Compose and run ordered transformation pipelines over env objects.
 */

const pipelines = new Map();

/**
 * Register a named pipeline with an ordered list of step functions.
 * Each step receives (env, options) and returns a (possibly modified) env.
 */
function registerPipeline(name, steps) {
  if (!name || typeof name !== 'string') throw new Error('Pipeline name must be a non-empty string');
  if (!Array.isArray(steps) || steps.length === 0) throw new Error('Pipeline must have at least one step');
  steps.forEach((s, i) => {
    if (typeof s !== 'function') throw new Error(`Step at index ${i} is not a function`);
  });
  pipelines.set(name, [...steps]);
}

function unregisterPipeline(name) {
  return pipelines.delete(name);
}

function listPipelines() {
  return Array.from(pipelines.keys());
}

/**
 * Run a registered pipeline by name over the given env object.
 * Returns { result, steps: [{name, before, after}] } for audit/debug.
 */
async function runPipeline(name, env, options = {}) {
  if (!pipelines.has(name)) throw new Error(`Pipeline "${name}" not found`);
  const steps = pipelines.get(name);
  const log = [];
  let current = { ...env };

  for (let i = 0; i < steps.length; i++) {
    const before = { ...current };
    const result = await steps[i](current, options);
    if (result && typeof result === 'object') {
      current = result;
    }
    log.push({ step: i, before, after: { ...current } });
  }

  return { result: current, steps: log };
}

/**
 * Build an ad-hoc pipeline from an array of step functions and run it immediately.
 */
async function runInlinePipeline(steps, env, options = {}) {
  const name = '__inline__';
  registerPipeline(name, steps);
  try {
    return await runPipeline(name, env, options);
  } finally {
    unregisterPipeline(name);
  }
}

function clearPipelines() {
  pipelines.clear();
}

module.exports = {
  registerPipeline,
  unregisterPipeline,
  listPipelines,
  runPipeline,
  runInlinePipeline,
  clearPipelines,
};
