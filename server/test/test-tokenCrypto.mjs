import { encryptToken, decryptToken } from '../utils/tokenCrypto.mjs';

const sampleToken = 'IGQVJYeDRZAUzVTRnNFV09D...sample_instagram_long_lived_token_12345';
console.log('Testing token encryption...');

const encrypted = encryptToken(sampleToken);
console.log('Encrypted payload:', encrypted);

const decrypted = decryptToken(encrypted);
console.log('Decryption matches original token:', decrypted === sampleToken);

if (decrypted !== sampleToken) {
  process.exit(1);
}
console.log('Token Crypto Test PASSED successfully!');
