/**
 * snapshotTags.js
 * Manage human-readable tags for snapshots (aliases, labels).
 */

const fs = require('fs');
const path = require('path');

const TAGS_FILE = path.join(process.cwd(), '.envault', 'snapshot-tags.json');

function loadTags() {
  if (!fs.existsSync(TAGS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(TAGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveTags(tags) {
  const dir = path.dirname(TAGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2), 'utf8');
}

function tagSnapshot(snapshotId, tag) {
  if (!snapshotId || !tag) throw new Error('snapshotId and tag are required');
  if (!/^[a-zA-Z0-9_-]+$/.test(tag)) throw new Error('Tag must be alphanumeric with dashes/underscores only');
  const tags = loadTags();
  tags[tag] = snapshotId;
  saveTags(tags);
  return { tag, snapshotId };
}

function untagSnapshot(tag) {
  if (!tag) throw new Error('tag is required');
  const tags = loadTags();
  if (!tags[tag]) throw new Error(`Tag "${tag}" not found`);
  const snapshotId = tags[tag];
  delete tags[tag];
  saveTags(tags);
  return { tag, snapshotId };
}

function resolveTag(tag) {
  const tags = loadTags();
  if (!tags[tag]) throw new Error(`Tag "${tag}" not found`);
  return tags[tag];
}

function listTags() {
  const tags = loadTags();
  return Object.entries(tags).map(([tag, snapshotId]) => ({ tag, snapshotId }));
}

function getTagsForSnapshot(snapshotId) {
  const tags = loadTags();
  return Object.entries(tags)
    .filter(([, sid]) => sid === snapshotId)
    .map(([tag]) => tag);
}

module.exports = { tagSnapshot, untagSnapshot, resolveTag, listTags, getTagsForSnapshot };
