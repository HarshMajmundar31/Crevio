import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[Auth] FATAL: JWT_SECRET is not set in environment variables. Legacy token auth will not function.');
}

export function signAccessToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Cannot sign tokens.');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function verifyAccessToken(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Cannot verify tokens.');
  }
  return jwt.verify(token, JWT_SECRET);
}
