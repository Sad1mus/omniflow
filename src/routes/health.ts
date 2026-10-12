import { Router } from 'express';
import { env } from '../config/env';
import { getSupabaseAdmin } from '../lib/supabase';
import { getRedisClient } from '../lib/redis-client';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  // Base de datos
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('tenants').select('id').limit(1);
    checks.database = !error;
    if (error) {
      errors.push(`Database: ${error.message}`);
    }
  } catch (err: any) {
    checks.database = false;
    errors.push(`Database: ${err.message}`);
  }

  // Redis
  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.redis = true;
  } catch (err: any) {
    checks.redis = false;
    errors.push(`Redis: ${err.message}`);
  }

  // WhatsApp provider config
  checks.whatsappProvider = !!env.WHATSAPP_PROVIDER;
  checks.metaConfigured = !!env.META_APP_SECRET && !!env.META_VERIFY_TOKEN && !!env.META_ACCESS_TOKEN;

  // Estado general
  const isHealthy = Object.values(checks).every(Boolean) && errors.length === 0;

  res.status(isHealthy ? 200 : 503).json({
    service: 'omniflow-crm',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    checks,
    errors: errors.length > 0 ? errors : undefined,
    uptime: process.uptime(),
  });
});

/**
 * Liveness probe (para Kubernetes)
 */
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * Readiness probe (para Kubernetes)
 */
router.get('/ready', async (req, res) => {
  // Simpler version that just checks critical deps
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