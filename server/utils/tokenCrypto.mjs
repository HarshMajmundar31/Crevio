import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM

function getEncryptionKey() {
  const hexKey = process.env.TOKEN_ENCRYPTION_KEY || '9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a0';
  const keyBuffer = Buffer.from(hexKey, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 32-byte (64 character) hex string');
  }

  return keyBuffer;
}

/**
 * Encrypts a plaintext OAuth token using AES-256-GCM.
 * @param {string} plainToken - Token string to encrypt
 * @returns {string} Stringified JSON object containing iv, authTag, and content (hex)
 */
export function encryptToken(plainToken) {
  if (!plainToken || typeof plainToken !== 'string') {
    throw new Error('Invalid token string provided for encryption');
  }

  const keyBuffer = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(plainToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag,
    content: encrypted,
  });
}

/**
 * Decrypts an encrypted token JSON string back to original plaintext.
 * @param {string} encryptedJson - JSON string containing iv, authTag, and content
 * @returns {string} Plaintext token string
 */
export function decryptToken(encryptedJson) {
  if (!encryptedJson || typeof encryptedJson !== 'string') {
    throw new Error('Invalid encrypted token payload');
  }

  const { iv, authTag, content } = JSON.parse(encryptedJson);
  if (!iv || !authTag || !content) {
    throw new Error('Corrupted token payload structure');
  }

  const keyBuffer = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, Buffer.from(iv, 'hex'));

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
