/**
 * envGrouping.js — Group env keys by prefix or custom label
 */

const fs = require('fs');
const path = require('path');

const GROUPS_DIR = path.join(process.cwd(), '.envault', 'groups');
const GROUPS_FILE = 'groups.json';

function ensureGroupsDir() {
  if (!fs.existsSync(GROUPS_DIR)) {
    fs.mkdirSync(GROUPS_DIR, { recursive: true });
  }
}

function groupsFilePath() {
  return path.join(GROUPS_DIR, GROUPS_FILE);
}

function loadGroups() {
  ensureGroupsDir();
  const fp = groupsFilePath();
  if (!fs.existsSync(fp)) return {};
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function saveGroups(groups) {
  ensureGroupsDir();
  fs.writeFileSync(groupsFilePath(), JSON.stringify(groups, null, 2));
}

function addKeyToGroup(groupName, key) {
  if (!groupName || !key) throw new Error('Group name and key are required');
  const groups = loadGroups();
  if (!groups[groupName]) groups[groupName] = [];
  if (!groups[groupName].includes(key)) {
    groups[groupName].push(key);
  }
  saveGroups(groups);
  return groups[groupName];
}

function removeKeyFromGroup(groupName, key) {
  const groups = loadGroups();
  if (!groups[groupName]) return [];
  groups[groupName] = groups[groupName].filter(k => k !== key);
  if (groups[groupName].length === 0) delete groups[groupName];
  saveGroups(groups);
  return groups[groupName] || [];
}

function getGroup(groupName) {
  const groups = loadGroups();
  return groups[groupName] || [];
}

function listGroups() {
  return loadGroups();
}

function deleteGroup(groupName) {
  const groups = loadGroups();
  if (!groups[groupName]) return false;
  delete groups[groupName];
  saveGroups(groups);
  return true;
}

function autoGroupByPrefix(envObj) {
  const result = {};
  for (const key of Object.keys(envObj)) {
    const parts = key.split('_');
    const prefix = parts.length > 1 ? parts[0] : '__ungrouped__';
    if (!result[prefix]) result[prefix] = [];
    result[prefix].push(key);
  }
  return result;
}

module.exports = {
  ensureGroupsDir,
  groupsFilePath,
  loadGroups,
  saveGroups,
  addKeyToGroup,
  removeKeyFromGroup,
  getGroup,
  listGroups,
  deleteGroup,
  autoGroupByPrefix,
};
