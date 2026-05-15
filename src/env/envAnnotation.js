/**
 * envAnnotation.js
 * Attach human-readable annotations (comments/notes) to individual env keys.
 */

const fs = require('fs');
const path = require('path');

const ANNOTATIONS_DIR = path.resolve('.envault', 'annotations');

function ensureAnnotationsDir() {
  if (!fs.existsSync(ANNOTATIONS_DIR)) {
    fs.mkdirSync(ANNOTATIONS_DIR, { recursive: true });
  }
}

function annotationsFilePath(vaultName) {
  return path.join(ANNOTATIONS_DIR, `${vaultName}.json`);
}

function loadAnnotations(vaultName) {
  ensureAnnotationsDir();
  const filePath = annotationsFilePath(vaultName);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveAnnotations(vaultName, annotations) {
  ensureAnnotationsDir();
  fs.writeFileSync(annotationsFilePath(vaultName), JSON.stringify(annotations, null, 2), 'utf8');
}

function annotateKey(vaultName, key, note) {
  if (!key || typeof key !== 'string') throw new Error('Invalid key');
  if (!note || typeof note !== 'string') throw new Error('Annotation note must be a non-empty string');
  const annotations = loadAnnotations(vaultName);
  annotations[key] = { note, updatedAt: new Date().toISOString() };
  saveAnnotations(vaultName, annotations);
  return annotations[key];
}

function removeAnnotation(vaultName, key) {
  const annotations = loadAnnotations(vaultName);
  if (!Object.prototype.hasOwnProperty.call(annotations, key)) return false;
  delete annotations[key];
  saveAnnotations(vaultName, annotations);
  return true;
}

function getAnnotation(vaultName, key) {
  const annotations = loadAnnotations(vaultName);
  return annotations[key] || null;
}

function listAnnotations(vaultName) {
  return loadAnnotations(vaultName);
}

module.exports = {
  ensureAnnotationsDir,
  annotationsFilePath,
  loadAnnotations,
  saveAnnotations,
  annotateKey,
  removeAnnotation,
  getAnnotation,
  listAnnotations,
};
