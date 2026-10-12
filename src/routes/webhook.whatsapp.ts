import { Router, Request, Response } from 'express';

import { env } from '../config/env';
import { logger } from '../lib/logger';
import { asyncHandler } from '../lib/errors';
import { verifyMetaSignature, verifySubscriptionChallenge } from '../core/whatsapp/signature';
import { InboundMessageService } from '../core/services/inbound-message.service';
import { getSupabaseAdmin } from '../lib/supabase';

const router = Router();
const inboundService = new InboundMessageService();

/**
 * GET /webhook/whatsapp - Verificación de suscripción de Meta
 */
router.get('/webhook/whatsapp', asyncHandler(async (req: Request, res: Response) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  logger.info({ mode, token: token ? '[PRESENT]' : '[MISSING]' }, 'Meta webhook verification request');

  if (!mode || !token || !challenge) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  if (token !== env.META_VERIFY_TOKEN) {
    logger.warn({ received: token }, 'Invalid verify token');
    return res.status(403).json({ error: 'Invalid verify token' });
  }

  const verifiedChallenge = verifySubscriptionChallenge(
    String(mode),
    String(challenge),
    env.META_VERIFY_TOKEN
  );

  logger.info('Meta webhook verified successfully');
  return res.status(200).send(verifiedChallenge);
}));

/**
 * POST /webhook/whatsapp - Recepción de eventos de WhatsApp (mensajes, status, etc.)
 */
router.post('/webhook/whatsapp', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const rawBody = (req as any).rawBody as string | undefined;

  // 1. Verificar firma de Meta
  const sig = signature ?? '';
  const appSecret = env.META_APP_SECRET ?? '';
  if (!sig || !verifyMetaSignature(rawBody ?? '', sig, appSecret)) {
    logger.warn({ signature: sig ? '[PRESENT]' : '[MISSING]' }, 'Invalid Meta signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  logger.info({ entryCount: req.body?.entry?.length }, 'Meta webhook received');

  // 2. Procesar payload (idempotencia, guardado, encolado)
  await inboundService.process(req.body);

  // 3. Responder 200 rápido a Meta (< 100ms)
  return res.status(200).json({ received: true });
}));

export const webhookRouter = router;