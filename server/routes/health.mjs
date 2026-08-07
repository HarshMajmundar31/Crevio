import { Router } from 'express';
import { query } from '../lib/db.mjs';

const router = Router();

router.get('/', async (_req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    const result = await query('SELECT NOW()');
    if (result.rows.length > 0) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbError = err?.message || String(err);
  }

  res.json({
    service: 'acems-api',
    status: 'ok',
    database: dbStatus,
    dbError,
    timestamp: new Date().toISOString(),
  });
});

export default router;
