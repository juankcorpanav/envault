const https = require('https');
const http = require('http');
const { parseEnv } = require('../secrets/envParser');

/**
 * Fetches raw env content from a URL (http or https).
 * @param {string} url
 * @returns {Promise<string>}
 */
function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/**
 * Imports env vars from a remote URL.
 * @param {string} url - URL returning raw .env content.
 * @returns {Promise<Object>} Parsed key-value pairs.
 */
async function importFromUrl(url) {
  const raw = await fetchFromUrl(url);
  return parseEnv(raw);
}

/**
 * Imports env vars from a JSON object (e.g. from a secrets manager API response).
 * Expects flat { key: value } structure.
 * @param {Object} jsonObj
 * @returns {Object}
 */
function importFromJson(jsonObj) {
  if (typeof jsonObj !== 'object' || jsonObj === null || Array.isArray(jsonObj)) {
    throw new Error('importFromJson expects a plain object');
  }
  const result = {};
  for (const [key, value] of Object.entries(jsonObj)) {
    result[key] = String(value);
  }
  return result;
}

/**
 * Imports env vars from a base64-encoded .env string.
 * @param {string} base64String
 * @returns {Object}
 */
function importFromBase64(base64String) {
  const decoded = Buffer.from(base64String, 'base64').toString('utf8');
  return parseEnv(decoded);
}

module.exports = { fetchFromUrl, importFromUrl, importFromJson, importFromBase64 };
