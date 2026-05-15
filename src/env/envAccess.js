/**
 * envAccess.js — Role-based access control for vault keys
 */

const fs = require('fs');
const path = require('path');

const ACCESS_DIR = path.resolve('.envault', 'access');
const ROLES = ['owner', 'editor', 'viewer'];

function ensureAccessDir() {
  if (!fs.existsSync(ACCESS_DIR)) fs.mkdirSync(ACCESS_DIR, { recursive: true });
}

function accessFilePath(vaultName) {
  return path.join(ACCESS_DIR, `${vaultName}.access.json`);
}

function loadAccessRules(vaultName) {
  const filePath = accessFilePath(vaultName);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveAccessRules(vaultName, rules) {
  ensureAccessDir();
  fs.writeFileSync(accessFilePath(vaultName), JSON.stringify(rules, null, 2));
}

function grantAccess(vaultName, user, role) {
  if (!ROLES.includes(role)) throw new Error(`Invalid role: ${role}. Must be one of: ${ROLES.join(', ')}`);
  const rules = loadAccessRules(vaultName);
  rules[user] = role;
  saveAccessRules(vaultName, rules);
  return { user, role, vault: vaultName };
}

function revokeAccess(vaultName, user) {
  const rules = loadAccessRules(vaultName);
  if (!rules[user]) throw new Error(`User '${user}' has no access rules for vault '${vaultName}'`);
  delete rules[user];
  saveAccessRules(vaultName, rules);
  return { user, vault: vaultName };
}

function getRole(vaultName, user) {
  const rules = loadAccessRules(vaultName);
  return rules[user] || null;
}

function canWrite(vaultName, user) {
  const role = getRole(vaultName, user);
  return role === 'owner' || role === 'editor';
}

function canRead(vaultName, user) {
  const role = getRole(vaultName, user);
  return ROLES.includes(role);
}

function listAccess(vaultName) {
  return loadAccessRules(vaultName);
}

module.exports = {
  ensureAccessDir,
  accessFilePath,
  loadAccessRules,
  saveAccessRules,
  grantAccess,
  revokeAccess,
  getRole,
  canWrite,
  canRead,
  listAccess,
  ROLES
};
