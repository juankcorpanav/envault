/**
 * envProfile.js
 * Manage named environment profiles (e.g. development, staging, production)
 * allowing quick switching between pre-defined env configurations.
 */

const fs = require('fs');
const path = require('path');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

const PROFILES_DIR = path.resolve(process.cwd(), '.envault', 'profiles');

function ensureProfilesDir() {
  if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
  }
}

function profilePath(name) {
  return path.join(PROFILES_DIR, `${name}.env`);
}

function saveProfile(name, envObject) {
  if (!name || typeof name !== 'string' || !/^[\w-]+$/.test(name)) {
    throw new Error(`Invalid profile name: "${name}"`);
  }
  ensureProfilesDir();
  const content = serializeEnv(envObject);
  fs.writeFileSync(profilePath(name), content, 'utf8');
  return { name, keys: Object.keys(envObject).length };
}

function loadProfile(name) {
  const filePath = profilePath(name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Profile "${name}" not found.`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parseEnv(content);
}

function listProfiles() {
  ensureProfilesDir();
  return fs.readdirSync(PROFILES_DIR)
    .filter(f => f.endsWith('.env'))
    .map(f => f.replace(/\.env$/, ''));
}

function deleteProfile(name) {
  const filePath = profilePath(name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Profile "${name}" not found.`);
  }
  fs.unlinkSync(filePath);
  return { deleted: name };
}

function renameProfile(oldName, newName) {
  if (!newName || !/^[\w-]+$/.test(newName)) {
    throw new Error(`Invalid profile name: "${newName}"`);
  }
  const oldPath = profilePath(oldName);
  if (!fs.existsSync(oldPath)) {
    throw new Error(`Profile "${oldName}" not found.`);
  }
  fs.renameSync(oldPath, profilePath(newName));
  return { renamed: { from: oldName, to: newName } };
}

module.exports = { saveProfile, loadProfile, listProfiles, deleteProfile, renameProfile };
