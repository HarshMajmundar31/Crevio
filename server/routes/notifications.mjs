import { Router } from 'express';
import { query } from '../lib/db.mjs';
import { requireAuth } from '../middleware/require-auth.mjs';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const result = await query(
    `SELECT id, user_id, contract_id, decision_id, title, message, is_read, created_at, read_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user.userId]
  );

  return res.json({ notifications: result.rows });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  const notificationId = req.params.id;

  const result = await query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [notificationId, req.user.userId]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  return res.json({ id: notificationId, isRead: true });
});

export default router;
