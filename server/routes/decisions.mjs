import { Router } from 'express';
import { query } from '../lib/db.mjs';
import { requireAuth } from '../middleware/require-auth.mjs';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const whereClause = req.user.role === 'admin'
    ? ''
    : 'WHERE c.brand_id = $1 OR c.creator_id = $1';
  const params = req.user.role === 'admin' ? [] : [req.user.userId];

  const result = await query(
    `SELECT d.id, d.contract_id, d.decision, d.confidence_score, d.processing_time_ms, d.evaluated_at,
            c.status AS contract_status, c.brand_id, c.creator_id
     FROM decision_evaluations d
     JOIN contracts c ON c.id = d.contract_id
     ${whereClause}
     ORDER BY d.evaluated_at DESC`,
    params
  );

  return res.json({ decisions: result.rows });
});

export default router;
