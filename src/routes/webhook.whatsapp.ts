import { Router, Request, Response } from 'express';

import { env } from '../config/env';
import { logger } from '../lib/logger';
import { asyncHandler } from '../lib/errors';
import { verifyMetaSignature, verifySubscriptionChallenge } from '../core/whatsapp/signature';
import { getBullQueue } from '../lib/redis';

const router = Router();

/**
 * Parse the Meta webhook payload into InboundJobData items.
 * Returns an array of jobs to enqueue (one per message).
 */
function parseMetaPayload(body: any): Array<{
  phoneNumberId: string;
  wabaId?: string;
  messageId: string;
  contactPhone: string;
  contactName?: string;
  message: {
    type: string;
    text?: { body: string };
    image?: { caption?: string };
    audio?: unknown;
    video?: unknown;
    document?: unknown;
  };
  timestamp: string;
}> {
  const jobs: Array<{
    phoneNumberId: string;
    wabaId?: string;
    messageId: string;
    contactPhone: string;
    contactName?: string;
    message: {
      type: string;
      text?: { body: string };
      image?: { caption?: string };
      audio?: unknown;
      video?: unknown;
      document?: unknown;
    };
    timestamp: string;
  }> = [];

  const entries = body?.entry ?? [];
  for (const entry of entries) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value ?? {};
      const metadata = value?.metadata ?? {};
      const phoneNumberId = metadata?.phone_number_id ?? '';
      const wabaId = metadata?.waba_id ?? entry?.id ?? '';

      const messages = value?.messages ?? [];
      for (const msg of messages) {
        const contact = value?.contacts?.find(
          (c: any) => c?.wa_id === msg?.from
        );
        jobs.push({
          phoneNumberId,
          wabaId: wabaId || undefined,
          messageId: msg?.id ?? '',
          contactPhone: msg?.from ?? '',
          contactName: contact?.profile?.name ?? undefined,
          message: {
            type: msg?.type ?? 'text',
            text: msg?.text,
            image: msg?.image,
            audio: msg?.audio,
            video: msg?.video,
            document: msg?.document,
          },
          timestamp: msg?.timestamp ?? new Date().toISOString(),
        });
      }
    }
  }

  return jobs;
}

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
    String(token),
    String(challenge),
    env.META_VERIFY_TOKEN
  );

  if (!verifiedChallenge.valid || !verifiedChallenge.challenge) {
    logger.warn({ mode, token: token ? '[PRESENT]' : '[MISSING]' }, 'Meta webhook verification failed');
    return res.status(403).json({ error: 'Verification failed' });
  }

  logger.info('Meta webhook verified successfully');
  return res.status(200).send(verifiedChallenge.challenge);
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

  // 2. Parsear payload y encolar jobs en BullMQ (el worker los consume)
  const jobs = parseMetaPayload(req.body);
  if (jobs.length === 0) {
    logger.info('No messages to enqueue');
    return res.status(200).json({ received: true });
  }

  const queue = getBullQueue();
  for (const job of jobs) {
    await queue.add('whatsapp-inbound', job);
  }

  // 3. Responder 200 rápido a Meta (< 100ms)
  return res.status(200).json({ received: true });
}));

export const webhookRouter = router;