/**
 * envPinning.js — Pin specific env keys to prevent accidental overwrite or deletion.
 */

const fs = require('fs');
const path = require('path');

const PINS_DIR = path.resolve('.envault', 'pins');
const pinsFile = (vaultName) => path.join(PINS_DIR, `${vaultName}.pins.json`);

function ensurePinsDir() {
  if (!fs.existsSync(PINS_DIR)) {
    fs.mkdirSync(PINS_DIR, { recursive: true });
  }
}

function loadPins(vaultName) {
  ensurePinsDir();
  const file = pinsFile(vaultName);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function savePins(vaultName, pins) {
  ensurePinsDir();
  fs.writeFileSync(pinsFile(vaultName), JSON.stringify(pins, null, 2), 'utf8');
}

function pinKey(vaultName, key) {
  const pins = loadPins(vaultName);
  if (pins.includes(key)) return { pinned: false, reason: 'Key already pinned' };
  pins.push(key);
  savePins(vaultName, pins);
  return { pinned: true, key, vault: vaultName };
}

function unpinKey(vaultName, key) {
  const pins = loadPins(vaultName);
  const idx = pins.indexOf(key);
  if (idx === -1) return { unpinned: false, reason: 'Key not pinned' };
  pins.splice(idx, 1);
  savePins(vaultName, pins);
  return { unpinned: true, key, vault: vaultName };
}

function isPinned(vaultName, key) {
  return loadPins(vaultName).includes(key);
}

function listPinned(vaultName) {
  return loadPins(vaultName);
}

function assertNotPinned(vaultName, key) {
  if (isPinned(vaultName, key)) {
    throw new Error(`Key "${key}" is pinned in vault "${vaultName}" and cannot be modified or deleted.`);
  }
}

module.exports = { ensurePinsDir, pinsFile, pinKey, unpinKey, isPinned, listPinned, assertNotPinned };
