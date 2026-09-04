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
  const name = (typeof nameCandidate === 'string' && nameCandidate.trim()) || (email ? email.split('@')[0] : 'Crevio User');

  return { userId, email, name };
}

async function findOrBootstrapUser({ userId, email, name }, sessionClaims = {}) {
  const jwtRole = sessionClaims.metadata?.role || sessionClaims.public_metadata?.role || sessionClaims.role;

  const userResult = await query(
    `SELECT id, full_name, email, role 
     FROM users 
     WHERE id = $1 OR (email IS NOT NULL AND $2::text IS NOT NULL AND LOWER(email) = LOWER($2))
     ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END 
     LIMIT 1`,
    [userId, email || null]
  );

  let existingUser = userResult.rows[0] || null;

  const isAdminEmail = email && bootstrapAdminEmails.has(email.toLowerCase());
  const targetRole = isAdminEmail || jwtRole === 'admin' ? 'admin' : jwtRole;

  if (existingUser) {
    const effectiveRole = targetRole && ['admin', 'brand', 'creator'].includes(targetRole) ? targetRole : existingUser.role;
    const updated = await query(
      `UPDATE users 
       SET id = $1,
           full_name = COALESCE($2, full_name),
           email = COALESCE($3, email),
           role = $4,
           is_active = TRUE,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, full_name, email, role`,
      [userId, name, email, effectiveRole, existingUser.id]
    );
    return updated.rows[0] || existingUser;
  }

  if (!email && !targetRole) {
    return null;
  }

  const roleToInsert = targetRole || 'creator';

  try {
    const inserted = await query(
      `INSERT INTO users (id, full_name, email, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email,
         role = $4,
         is_active = TRUE,
         updated_at = NOW()
       RETURNING id, full_name, email, role`,
      [userId, name, email, roleToInsert]
    );

    return inserted.rows[0] || null;
  } catch (err) {
    if (err?.code === '23505' && email) {
      const updated = await query(
        `UPDATE users
         SET id = $1,
             full_name = COALESCE($2, full_name),
             is_active = TRUE,
             updated_at = NOW()
         WHERE LOWER(email) = LOWER($3)
         RETURNING id, full_name, email, role`,
        [userId, name, email]
      );
      return updated.rows[0] || null;
    }
    throw err;
  }
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
    
    // Check if role exists directly in Clerk JWT session claims
    const sessionClaims = auth.sessionClaims || {};
    const jwtRole = 
      sessionClaims.metadata?.role || 
      sessionClaims.public_metadata?.role || 
      sessionClaims.role;

    if (jwtRole && ['brand', 'creator', 'admin'].includes(jwtRole)) {
      req.authContext = profile;
      req.user = {
        userId: auth.userId,
        role: jwtRole,
        email: profile.email,
        name: profile.name,
      };
      return next();
    }

    // Fallback: Check DB if role is not in JWT claims yet
    const user = await findOrBootstrapUser(profile, auth.sessionClaims || {});

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
