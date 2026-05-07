const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generates a new cryptographically secure secret value.
 * @param {number} length - Length of the generated secret in bytes (default 32)
 * @returns {string} Hex-encoded secret string
 */
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Rotates a specific key in an env object, returning updated env and rotation record.
 * @param {Object} envVars - Current env key-value pairs
 * @param {string} key - The key to rotate
 * @returns {{ updatedEnv: Object, rotationRecord: Object }}
 */
function rotateSecret(envVars, key) {
  if (!envVars.hasOwnProperty(key)) {
    throw new Error(`Key "${key}" not found in env variables.`);
  }

  const previousValue = envVars[key];
  const newValue = generateSecret();
  const rotatedAt = new Date().toISOString();

  const updatedEnv = { ...envVars, [key]: newValue };

  const rotationRecord = {
    key,
    previousValue,
    newValue,
    rotatedAt,
  };

  return { updatedEnv, rotationRecord };
}

/**
 * Appends a rotation record to the rotation history log file.
 * @param {string} historyFilePath - Path to the rotation history JSON file
 * @param {Object} rotationRecord - The rotation record to append
 */
function logRotation(historyFilePath, rotationRecord) {
  let history = [];

  if (fs.existsSync(historyFilePath)) {
    const raw = fs.readFileSync(historyFilePath, 'utf-8');
    try {
      history = JSON.parse(raw);
    } catch {
      history = [];
    }
  }

  history.push(rotationRecord);
  fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf-8');
}

module.exports = { generateSecret, rotateSecret, logRotation };
