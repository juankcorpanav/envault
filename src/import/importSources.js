const https = require('https');
const http = require('http');
const { parseEnv } = require('../secrets/envParser');

/**
 * Fetches env content from a remote URL (http or https).
 * @param {string} url
 * @returns {Promise<string>} raw env file content
 */
function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Failed to fetch from URL: HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Imports env variables from a JSON object or JSON string.
 * @param {string|object} json
 * @returns {object} parsed key-value env map
 */
function importFromJson(json) {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      throw new Error('JSON input must be a plain object');
    }
    const result = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'string') {
        throw new Error(`Value for key "${key}" must be a string`);
      }
      result[key] = value;
    }
    return result;
  } catch (err) {
    throw new Error(`importFromJson failed: ${err.message}`);
  }
}

/**
 * Imports env variables from a Base64-encoded .env string.
 * @param {string} base64String
 * @returns {object} parsed key-value env map
 */
function importFromBase64(base64String) {
  try {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');
    return parseEnv(decoded);
  } catch (err) {
    throw new Error(`importFromBase64 failed: ${err.message}`);
  }
}

module.exports = { fetchFromUrl, importFromJson, importFromBase64 };
