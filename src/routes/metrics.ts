import { Router } from 'express';
import { register } from '../lib/observability/metrics.js';

const router = Router();

router.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(String(error));
  }
});

export const metricsRouter = router;