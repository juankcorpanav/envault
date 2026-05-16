/**
 * envRemapping.js
 * Remap env keys according to a mapping spec (rename keys in bulk).
 */

const fs = require('fs');
const path = require('path');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

const REMAPS_DIR = path.join(process.cwd(), '.envault', 'remaps');

function ensureRemapsDir() {
  if (!fs.existsSync(REMAPS_DIR)) fs.mkdirSync(REMAPS_DIR, { recursive: true });
}

function remapFilePath(name) {
  return path.join(REMAPS_DIR, `${name}.json`);
}

function loadRemap(name) {
  const fp = remapFilePath(name);
  if (!fs.existsSync(fp)) return {};
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function saveRemap(name, mapping) {
  ensureRemapsDir();
  fs.writeFileSync(remapFilePath(name), JSON.stringify(mapping, null, 2));
}

/**
 * Apply a key mapping to an env object.
 * mapping: { OLD_KEY: 'NEW_KEY', ... }
 * Keys not in the mapping are kept as-is.
 * If dropUnmapped is true, keys not in the mapping are dropped.
 */
function applyRemap(env, mapping, { dropUnmapped = false } = {}) {
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    if (mapping[key]) {
      result[mapping[key]] = value;
    } else if (!dropUnmapped) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Invert a mapping: { OLD: NEW } -> { NEW: OLD }
 */
function invertRemap(mapping) {
  return Object.fromEntries(Object.entries(mapping).map(([k, v]) => [v, k]));
}

/**
 * Remap an env file and return the new env object.
 */
function remapEnvFile(filePath, mapping, options = {}) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parseEnv(raw);
  return applyRemap(env, mapping, options);
}

/**
 * List all saved remap profiles.
 */
function listRemaps() {
  ensureRemapsDir();
  return fs.readdirSync(REMAPS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''));
}

/**
 * Delete a saved remap profile.
 */
function deleteRemap(name) {
  const fp = remapFilePath(name);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

module.exports = {
  ensureRemapsDir,
  remapFilePath,
  loadRemap,
  saveRemap,
  applyRemap,
  invertRemap,
  remapEnvFile,
  listRemaps,
  deleteRemap,
};
