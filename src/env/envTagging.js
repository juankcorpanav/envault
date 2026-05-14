/**
 * envTagging.js
 * Attach arbitrary tags (labels) to env keys for grouping, filtering, and documentation.
 */

const fs = require('fs');
const path = require('path');

const TAGS_DIR = path.resolve('.envault', 'key-tags');

function ensureTagsDir() {
  if (!fs.existsSync(TAGS_DIR)) fs.mkdirSync(TAGS_DIR, { recursive: true });
}

function tagsFilePath(vaultName) {
  return path.join(TAGS_DIR, `${vaultName}.json`);
}

function loadKeyTags(vaultName) {
  ensureTagsDir();
  const file = tagsFilePath(vaultName);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveKeyTags(vaultName, tags) {
  ensureTagsDir();
  fs.writeFileSync(tagsFilePath(vaultName), JSON.stringify(tags, null, 2));
}

function tagKey(vaultName, key, tag) {
  if (!key || !tag) throw new Error('key and tag are required');
  const tags = loadKeyTags(vaultName);
  if (!tags[key]) tags[key] = [];
  if (!tags[key].includes(tag)) tags[key].push(tag);
  saveKeyTags(vaultName, tags);
  return tags[key];
}

function untagKey(vaultName, key, tag) {
  const tags = loadKeyTags(vaultName);
  if (!tags[key]) return [];
  tags[key] = tags[key].filter(t => t !== tag);
  if (tags[key].length === 0) delete tags[key];
  saveKeyTags(vaultName, tags);
  return tags[key] || [];
}

function getTagsForKey(vaultName, key) {
  return loadKeyTags(vaultName)[key] || [];
}

function getKeysByTag(vaultName, tag) {
  const tags = loadKeyTags(vaultName);
  return Object.entries(tags)
    .filter(([, keyTags]) => keyTags.includes(tag))
    .map(([key]) => key);
}

function clearTagsForKey(vaultName, key) {
  const tags = loadKeyTags(vaultName);
  delete tags[key];
  saveKeyTags(vaultName, tags);
}

module.exports = {
  ensureTagsDir,
  loadKeyTags,
  saveKeyTags,
  tagKey,
  untagKey,
  getTagsForKey,
  getKeysByTag,
  clearTagsForKey,
};
