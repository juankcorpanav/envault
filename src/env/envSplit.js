/**
 * envSplit.js — Split an env set into named groups/files by key prefix or pattern
 */

const { parseEnv, serializeEnv } = require('../secrets/envParser');
const fs = require('fs');
const path = require('path');

/**
 * Split env entries by prefix (e.g. "DB_" => { DB: { DB_HOST: ... } })
 * @param {Object} env - parsed env object
 * @param {string[]} prefixes - list of prefixes to split on
 * @returns {{ groups: Object.<string, Object>, remainder: Object }}
 */
function splitByPrefix(env, prefixes) {
  const groups = {};
  const remainder = {};

  for (const [key, value] of Object.entries(env)) {
    const matched = prefixes.find(p => key.startsWith(p));
    if (matched) {
      const groupName = matched.replace(/_+$/, '');
      if (!groups[groupName]) groups[groupName] = {};
      groups[groupName][key] = value;
    } else {
      remainder[key] = value;
    }
  }

  return { groups, remainder };
}

/**
 * Split env entries by a custom key→group mapping function
 * @param {Object} env
 * @param {Function} classifier - (key, value) => groupName | null
 * @returns {{ groups: Object.<string, Object>, remainder: Object }}
 */
function splitByClassifier(env, classifier) {
  const groups = {};
  const remainder = {};

  for (const [key, value] of Object.entries(env)) {
    const groupName = classifier(key, value);
    if (groupName) {
      if (!groups[groupName]) groups[groupName] = {};
      groups[groupName][key] = value;
    } else {
      remainder[key] = value;
    }
  }

  return { groups, remainder };
}

/**
 * Write split groups to separate .env files in an output directory
 * @param {{ groups: Object, remainder: Object }} splitResult
 * @param {string} outDir
 * @param {string} [remainderName='remainder']
 * @returns {string[]} list of written file paths
 */
function writeSplitFiles(splitResult, outDir, remainderName = 'remainder') {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const written = [];

  for (const [groupName, entries] of Object.entries(splitResult.groups)) {
    const filePath = path.join(outDir, `.env.${groupName.toLowerCase()}`);
    fs.writeFileSync(filePath, serializeEnv(entries), 'utf8');
    written.push(filePath);
  }

  if (Object.keys(splitResult.remainder).length > 0) {
    const filePath = path.join(outDir, `.env.${remainderName}`);
    fs.writeFileSync(filePath, serializeEnv(splitResult.remainder), 'utf8');
    written.push(filePath);
  }

  return written;
}

/**
 * Load and split an env file by prefixes, writing results to outDir
 */
function splitEnvFile(filePath, prefixes, outDir) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = parseEnv(raw);
  const result = splitByPrefix(env, prefixes);
  return writeSplitFiles(result, outDir);
}

module.exports = { splitByPrefix, splitByClassifier, writeSplitFiles, splitEnvFile };
