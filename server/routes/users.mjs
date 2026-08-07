import { Router } from 'express';
import { query } from '../lib/db.mjs';
import { requireAuth, requireRole } from '../middleware/require-auth.mjs';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const roleFilter = typeof req.query?.role === 'string' ? req.query.role : null;
  const allowedRoles = new Set(['brand', 'creator', 'admin']);

  if (roleFilter && !allowedRoles.has(roleFilter)) {
    return res.status(400).json({ error: 'Invalid role filter' });
  }

  // Non-admin users can only fetch creator list (for brand contract assignment workflows).
  if (req.user.role !== 'admin') {
    if (!roleFilter || roleFilter !== 'creator') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  const whereParts = ['is_active = TRUE'];
  const params = [];

  if (roleFilter) {
    params.push(roleFilter);
    whereParts.push(`role = $${params.length}`);
  }

  const result = await query(
    `SELECT id, full_name, email, role, avatar_url, created_at
     FROM users
     WHERE ${whereParts.join(' AND ')}
     ORDER BY created_at DESC`,
    params
  );

  return res.json({ users: result.rows });
});

router.post('/', requireAuth, requireRole('admin'), async (_req, res) => {
  return res.status(501).json({ error: 'User creation via API is not implemented yet. Use Clerk Dashboard.' });
});

export default router;
