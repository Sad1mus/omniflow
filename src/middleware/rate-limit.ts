import type { Request, Response, NextFunction } from 'express';

export function createRateLimitMiddleware(
  options: {
    windowMs?: number;
    maxRequests?: number;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
  } = {}
) {
  const {
    windowMs = 60000, // 1 minuto
    maxRequests = 100,
    skipFailedRequests = true,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress || 'unknown',
  } = options;

  const hits = new Map<string, { count: number; resetTime: number }>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = hits.get(key);

    // Limpiar registros expirados (limpieza perezosa)
    for (const [k, v] of hits.entries()) {
      if (now > v.resetTime) {
        hits.delete(k);
      }
    }

    if (!record || now > record.resetTime) {
      hits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests, please try again after ${Math.ceil(
            (record.resetTime - now) / 1000
          )} seconds`,
        },
      });
      return;
    }

    record.count++;
    next();
  };
}

/**
 * Rate limiter específico para webhooks de Meta
 */
export function createMetaWebhookRateLimiter() {
  return createRateLimitMiddleware({
    windowMs: 60000, // 1 minuto
    maxRequests: 80, // Meta permite ~80 msg/s por WABA
    keyGenerator: (req) => {
      // Limitar por WABA ID o Phone Number ID si está disponible
      const body = req.body as any;
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      return value?.phone_number_id || value?.waba_id || req.ip;
    },
  });
}