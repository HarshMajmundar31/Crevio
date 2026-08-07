import { getAuth } from '@clerk/express';
import { query } from '../lib/db.mjs';

function parseBootstrapAdminEmails() {
  return new Set(
    String(process.env.CLERK_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

const bootstrapAdminEmails = parseBootstrapAdminEmails();

function normalizeProfile(userId, sessionClaims = {}) {
  const emailCandidate =
    sessionClaims.email ||
    sessionClaims.email_address ||
    sessionClaims.primary_email_address ||
    null;

  const nameCandidate =
    sessionClaims.name ||
    [sessionClaims.first_name, sessionClaims.last_name].filter(Boolean).join(' ').trim() ||
    null;

  const email = typeof emailCandidate === 'string' ? emailCandidate : null;
  const name = (typeof nameCandidate === 'string' && nameCandidate.trim()) || (email ? email.split('@')[0] : 'ACEMS User');

  return { userId, email, name };
}

async function findOrBootstrapUser({ userId, email, name }) {
  const userResult = await query(
    'SELECT id, full_name, email, role FROM users WHERE id = $1 AND is_active = TRUE',
    [userId]
  );

  if (userResult.rows[0]) {
    return userResult.rows[0];
  }

  if (!email || !bootstrapAdminEmails.has(email.toLowerCase())) {
    return null;
  }

  const inserted = await query(
    `INSERT INTO users (id, full_name, email, role, is_active)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       email = EXCLUDED.email,
       role = 'admin',
       is_active = TRUE,
       updated_at = NOW()
     RETURNING id, full_name, email, role`,
    [userId, name, email]
  );

  return inserted.rows[0] || null;
}

export function requireClerkAuth(req, res, next) {
  try {
    const auth = getAuth(req);

    if (!auth?.userId) {
      return res.status(401).json({ error: 'Missing or invalid Clerk bearer token' });
    }

    const profile = normalizeProfile(auth.userId, auth.sessionClaims || {});
    req.authContext = profile;
    return next();
  } catch (error) {
    console.error('[requireClerkAuth Error]', error);
    return res.status(401).json({
      error: 'Unauthenticated',
      message: error?.message || 'Missing or invalid authentication credentials.',
    });
  }
}

export async function requireAuth(req, res, next) {
  try {
    let auth;
    try {
      auth = getAuth(req);
    } catch (err) {
      return res.status(401).json({
        error: 'Unauthenticated',
        message: err?.message || 'Missing or invalid authentication credentials.',
      });
    }

    if (!auth?.userId) {
      return res.status(401).json({ error: 'Missing or invalid Clerk bearer token' });
    }

    const profile = normalizeProfile(auth.userId, auth.sessionClaims || {});
    const user = await findOrBootstrapUser(profile);

    if (!user) {
      return res.status(403).json({
        error: 'User onboarding required',
        code: 'ONBOARDING_REQUIRED',
      });
    }

    req.authContext = profile;
    req.user = {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.full_name,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}
