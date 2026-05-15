/**
 * envScope.js — Scoped env key management
 * Allows keys to be organized and filtered by named scopes (e.g., 'frontend', 'backend', 'ci')
 */

const fs = require('fs');
const path = require('path');

const SCOPES_DIR = path.resolve('.envault', 'scopes');

function ensureScopesDir() {
  if (!fs.existsSync(SCOPES_DIR)) {
    fs.mkdirSync(SCOPES_DIR, { recursive: true });
  }
}

function scopesFilePath(vault) {
  return path.join(SCOPES_DIR, `${vault}.scopes.json`);
}

function loadScopes(vault) {
  ensureScopesDir();
  const fp = scopesFilePath(vault);
  if (!fs.existsSync(fp)) return {};
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function saveScopes(vault, scopes) {
  ensureScopesDir();
  fs.writeFileSync(scopesFilePath(vault), JSON.stringify(scopes, null, 2));
}

function assignScope(vault, key, scope) {
  const scopes = loadScopes(vault);
  if (!scopes[scope]) scopes[scope] = [];
  if (!scopes[scope].includes(key)) {
    scopes[scope].push(key);
  }
  saveScopes(vault, scopes);
  return scopes;
}

function removeFromScope(vault, key, scope) {
  const scopes = loadScopes(vault);
  if (!scopes[scope]) return scopes;
  scopes[scope] = scopes[scope].filter(k => k !== key);
  if (scopes[scope].length === 0) delete scopes[scope];
  saveScopes(vault, scopes);
  return scopes;
}

function getKeysInScope(vault, scope) {
  const scopes = loadScopes(vault);
  return scopes[scope] || [];
}

function getScopesForKey(vault, key) {
  const scopes = loadScopes(vault);
  return Object.entries(scopes)
    .filter(([, keys]) => keys.includes(key))
    .map(([scope]) => scope);
}

function listScopes(vault) {
  const scopes = loadScopes(vault);
  return Object.keys(scopes);
}

function filterEnvByScope(vault, env, scope) {
  const keys = getKeysInScope(vault, scope);
  return Object.fromEntries(
    Object.entries(env).filter(([k]) => keys.includes(k))
  );
}

module.exports = {
  ensureScopesDir,
  scopesFilePath,
  loadScopes,
  saveScopes,
  assignScope,
  removeFromScope,
  getKeysInScope,
  getScopesForKey,
  listScopes,
  filterEnvByScope,
};
