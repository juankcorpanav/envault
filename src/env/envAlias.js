/**
 * envAlias.js — Manage named aliases for environment profiles
 * Allows users to create short aliases (e.g. "prod" -> "production-us-east")
 */

const fs = require('fs');
const path = require('path');
const { ensureProfilesDir, profilePath } = require('./envProfile');

const ALIAS_FILE = path.join(process.cwd(), '.envault', 'aliases.json');

function loadAliases() {
  if (!fs.existsSync(ALIAS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ALIAS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveAliases(aliases) {
  const dir = path.dirname(ALIAS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ALIAS_FILE, JSON.stringify(aliases, null, 2), 'utf-8');
}

function setAlias(alias, profileName) {
  if (!alias || typeof alias !== 'string') throw new Error('Alias must be a non-empty string');
  if (!profileName || typeof profileName !== 'string') throw new Error('Profile name must be a non-empty string');
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) throw new Error(`Invalid alias format: "${alias}"`);

  const targetPath = profilePath(profileName);
  if (!fs.existsSync(targetPath)) throw new Error(`Profile "${profileName}" does not exist`);

  const aliases = loadAliases();
  aliases[alias] = profileName;
  saveAliases(aliases);
  return { alias, profileName };
}

function removeAlias(alias) {
  const aliases = loadAliases();
  if (!aliases[alias]) throw new Error(`Alias "${alias}" not found`);
  delete aliases[alias];
  saveAliases(aliases);
  return alias;
}

function resolveAlias(aliasOrProfile) {
  const aliases = loadAliases();
  return aliases[aliasOrProfile] || aliasOrProfile;
}

function listAliases() {
  return loadAliases();
}

module.exports = { loadAliases, saveAliases, setAlias, removeAlias, resolveAlias, listAliases };
