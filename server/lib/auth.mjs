import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'crevio-dev-secret-change-me';

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
