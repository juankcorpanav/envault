const crypto = require('crypto');
const { parseEnv, serializeEnv } = require('../secrets/envParser');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * Derives a symmetric key from a shared passphrase.
 * @param {string} passphrase
 * @returns {Buffer}
 */
function deriveKey(passphrase) {
  return crypto.scryptSync(passphrase, 'envault-salt', KEY_LENGTH);
}

/**
 * Encrypts a parsed env object for team sharing.
 * @param {Object} envObject - key/value pairs
 * @param {string} passphrase - shared team passphrase
 * @returns {{ iv: string, tag: string, data: string }}
 */
function encryptEnv(envObject, passphrase) {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('A valid passphrase is required for encryption.');
  }

  const key = deriveKey(passphrase);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = serializeEnv(envObject);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('hex'),
  };
}

/**
 * Decrypts a shared env payload back to a parsed env object.
 * @param {{ iv: string, tag: string, data: string }} payload
 * @param {string} passphrase - shared team passphrase
 * @returns {Object} key/value pairs
 */
function decryptEnv(payload, passphrase) {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('A valid passphrase is required for decryption.');
  }

  const { iv, tag, data } = payload;
  if (!iv || !tag || !data) {
    throw new Error('Invalid payload: missing iv, tag, or data.');
  }

  const key = deriveKey(passphrase);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, 'hex')),
    decipher.final(),
  ]);

  return parseEnv(decrypted.toString('utf8'));
}

module.exports = { encryptEnv, decryptEnv, deriveKey };
