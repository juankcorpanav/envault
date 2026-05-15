/**
 * envDependency.js
 * Manage key-level dependencies: declare that one env key requires another.
 */

const fs = require('fs');
const path = require('path');

const DEPS_DIR = path.resolve('.envault', 'dependencies');
const DEPS_FILE = path.join(DEPS_DIR, 'deps.json');

function ensureDepsDir() {
  if (!fs.existsSync(DEPS_DIR)) {
    fs.mkdirSync(DEPS_DIR, { recursive: true });
  }
}

function loadDependencies() {
  ensureDepsDir();
  if (!fs.existsSync(DEPS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DEPS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveDependencies(deps) {
  ensureDepsDir();
  fs.writeFileSync(DEPS_FILE, JSON.stringify(deps, null, 2), 'utf8');
}

function addDependency(key, requiredKey) {
  if (!key || !requiredKey) throw new Error('Both key and requiredKey must be provided.');
  if (key === requiredKey) throw new Error('A key cannot depend on itself.');
  const deps = loadDependencies();
  if (!deps[key]) deps[key] = [];
  if (!deps[key].includes(requiredKey)) {
    deps[key].push(requiredKey);
  }
  saveDependencies(deps);
  return deps[key];
}

function removeDependency(key, requiredKey) {
  const deps = loadDependencies();
  if (!deps[key]) return [];
  deps[key] = deps[key].filter(k => k !== requiredKey);
  if (deps[key].length === 0) delete deps[key];
  saveDependencies(deps);
  return deps[key] || [];
}

function getDependencies(key) {
  const deps = loadDependencies();
  return deps[key] || [];
}

function validateDependencies(envObj) {
  const deps = loadDependencies();
  const missing = [];
  for (const [key, required] of Object.entries(deps)) {
    if (!(key in envObj)) continue;
    for (const req of required) {
      if (!(req in envObj) || envObj[req] === '') {
        missing.push({ key, missingDep: req });
      }
    }
  }
  return missing;
}

function listAllDependencies() {
  return loadDependencies();
}

module.exports = {
  ensureDepsDir,
  loadDependencies,
  saveDependencies,
  addDependency,
  removeDependency,
  getDependencies,
  validateDependencies,
  listAllDependencies,
};
