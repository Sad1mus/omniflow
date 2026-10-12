import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { getSupabaseAdmin } from '../lib/supabase';
import { getRedisClient } from '../lib/redis-client';

const router = Router();

/**
 * Health check endpoint robusto - verifica DB, Redis y cola BullMQ.
 * Devuelve 503 Service Unavailable si algún componente crítico falla,
 * para que balanceadores de carga y orquestadores puedan detectar el problema.
 */
router.get('/', async (_req: Request, res: Response) => {
  const healthcheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    checks: {
      database: 'unknown',
      redis: 'unknown',
      queue: 'unknown',
    }
  };

  try {
    // 1. Check DB
    const supabase = getSupabaseAdmin();
    const { error: dbError } = await supabase.from('tenants').select('id').limit(1);
    healthcheck.checks.database = dbError ? 'error' : 'ok';

    // 2. Check Redis
    try {
      const redis = getRedisClient();
      await redis.ping();
      healthcheck.checks.redis = 'ok';
    } catch (e) {
      healthcheck.checks.redis = 'error';
    }

    // 3. Check BullMQ queue (se apoya del ping a Redis, ya verificado arriba)
    try {
      const { getBullQueue } = await import('../lib/redis.js');
      const queue = getBullQueue();
      // Validamos que la cola esté instanciada correctamente con su nombre
      healthcheck.checks.queue = !!queue ? 'ok' : 'error';
    } catch (e) {
      healthcheck.checks.queue = 'error';
    }

    // 4. Evaluar estado general
    if (
      healthcheck.checks.database === 'error' ||
      healthcheck.checks.redis === 'error' ||
      healthcheck.checks.queue === 'error'
    ) {
      healthcheck.status = 'degraded';
      res.status(503).json(healthcheck);
      return;
    }

    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'error';
    res.status(503).json(healthcheck);
  }
});

/**
 * Liveness probe (para Kubernetes)
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * Readiness probe (para Kubernetes)
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    await redis.ping();
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('tenants').select('id').limit(1);
    if (!error) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', error: error.message });
    }
  } catch (err: any) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});

export const healthRouter = router;