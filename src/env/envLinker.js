/**
 * envLinker.js
 * Link keys across vaults/profiles so changes propagate automatically.
 */

const fs = require('fs');
const path = require('path');

const LINKS_DIR = path.resolve('.envault', 'links');
const LINKS_FILE = path.join(LINKS_DIR, 'links.json');

function ensureLinksDir() {
  if (!fs.existsSync(LINKS_DIR)) {
    fs.mkdirSync(LINKS_DIR, { recursive: true });
  }
}

function loadLinks() {
  ensureLinksDir();
  if (!fs.existsSync(LINKS_FILE)) return [];
  return JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
}

function saveLinks(links) {
  ensureLinksDir();
  fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
}

function addLink(sourceVault, sourceKey, targetVault, targetKey) {
  const links = loadLinks();
  const exists = links.some(
    l => l.sourceVault === sourceVault && l.sourceKey === sourceKey &&
         l.targetVault === targetVault && l.targetKey === targetKey
  );
  if (exists) throw new Error(`Link already exists: ${sourceVault}:${sourceKey} -> ${targetVault}:${targetKey}`);
  links.push({ sourceVault, sourceKey, targetVault, targetKey, createdAt: new Date().toISOString() });
  saveLinks(links);
  return links[links.length - 1];
}

function removeLink(sourceVault, sourceKey, targetVault, targetKey) {
  const links = loadLinks();
  const filtered = links.filter(
    l => !(l.sourceVault === sourceVault && l.sourceKey === sourceKey &&
           l.targetVault === targetVault && l.targetKey === targetKey)
  );
  if (filtered.length === links.length) throw new Error('Link not found');
  saveLinks(filtered);
}

function resolveLinks(vaultName, key) {
  return loadLinks().filter(l => l.sourceVault === vaultName && l.sourceKey === key);
}

function listLinks() {
  return loadLinks();
}

function clearLinks() {
  saveLinks([]);
}

module.exports = { ensureLinksDir, loadLinks, saveLinks, addLink, removeLink, resolveLinks, listLinks, clearLinks };
