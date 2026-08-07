import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    service: 'acems-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
