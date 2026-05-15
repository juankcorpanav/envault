const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from a passphrase using scrypt.
 */
async function deriveEncryptionKey(passphrase, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(passphrase, salt, KEY_LENGTH, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64-encoded payload containing salt, iv, tag, and ciphertext.
 */
async function encryptValue(plaintext, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = await deriveEncryptionKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  const payload = Buffer.concat([salt, iv, tag, encrypted]);
  return payload.toString('base64');
}

/**
 * Decrypts a base64-encoded payload previously created by encryptValue.
 */
async function decryptValue(encoded, passphrase) {
  const payload = Buffer.from(encoded, 'base64');
  const salt = payload.slice(0, 16);
  const iv = payload.slice(16, 32);
  const tag = payload.slice(32, 32 + TAG_LENGTH);
  const ciphertext = payload.slice(32 + TAG_LENGTH);

  const key = await deriveEncryptionKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

/**
 * Encrypts all values in a parsed env object.
 */
async function encryptEnvValues(parsed, passphrase) {
  const result = {};
  for (const [key, value] of Object.entries(parsed)) {
    result[key] = await encryptValue(value, passphrase);
  }
  return result;
}

/**
 * Decrypts all values in a parsed env object.
 */
async function decryptEnvValues(parsed, passphrase) {
  const result = {};
  for (const [key, value] of Object.entries(parsed)) {
    result[key] = await decryptValue(value, passphrase);
  }
  return result;
}

module.exports = {
  encryptValue,
  decryptValue,
  encryptEnvValues,
  decryptEnvValues
};
