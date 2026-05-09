/**
 * envTemplate.js
 * Manage .env template files — define required keys with optional defaults and descriptions.
 */

const fs = require('fs');
const path = require('path');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

/**
 * Parse a .env.template file into a structured map.
 * Lines starting with # are treated as descriptions for the next key.
 * @param {string} content - Raw template file content
 * @returns {Array<{key: string, defaultValue: string|null, description: string|null}>}
 */
function parseTemplate(content) {
  const lines = content.split('\n');
  const entries = [];
  let pendingDescription = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      pendingDescription = trimmed.slice(1).trim();
      continue;
    }
    if (!trimmed || !trimmed.includes('=')) {
      pendingDescription = null;
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    const key = trimmed.slice(0, eqIdx).trim();
    const rawValue = trimmed.slice(eqIdx + 1).trim();
    entries.push({
      key,
      defaultValue: rawValue.length > 0 ? rawValue : null,
      description: pendingDescription,
    });
    pendingDescription = null;
  }

  return entries;
}

/**
 * Validate that a parsed env object satisfies all required keys in a template.
 * @param {Array} templateEntries - Output of parseTemplate
 * @param {Object} envObj - Parsed env key/value pairs
 * @returns {{ valid: boolean, missing: string[], withDefaults: Object }}
 */
function validateAgainstTemplate(templateEntries, envObj) {
  const missing = [];
  const withDefaults = { ...envObj };

  for (const entry of templateEntries) {
    if (!(entry.key in withDefaults)) {
      if (entry.defaultValue !== null) {
        withDefaults[entry.key] = entry.defaultValue;
      } else {
        missing.push(entry.key);
      }
    }
  }

  return { valid: missing.length === 0, missing, withDefaults };
}

/**
 * Generate a blank .env file from a template, filling in defaults.
 * @param {Array} templateEntries
 * @returns {string}
 */
function generateFromTemplate(templateEntries) {
  const lines = [];
  for (const entry of templateEntries) {
    if (entry.description) lines.push(`# ${entry.description}`);
    lines.push(`${entry.key}=${entry.defaultValue ?? ''}`);
  }
  return lines.join('\n') + '\n';
}

/**
 * Load and parse a template file from disk.
 * @param {string} templatePath
 * @returns {Array}
 */
function loadTemplate(templatePath) {
  const resolved = path.resolve(templatePath);
  if (!fs.existsSync(resolved)) throw new Error(`Template not found: ${resolved}`);
  const content = fs.readFileSync(resolved, 'utf8');
  return parseTemplate(content);
}

module.exports = { parseTemplate, validateAgainstTemplate, generateFromTemplate, loadTemplate };
