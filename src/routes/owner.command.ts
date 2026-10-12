import { Router, Request, Response } from 'express';

import { env } from '../config/env';
import { logger } from '../lib/logger';
import { asyncHandler } from '../lib/errors';
import { AppError } from '../lib/errors';
import { verifyMetaSignature } from '../core/whatsapp/signature';
import { getSupabaseAdmin } from '../lib/supabase';

const router = Router();
const supabase = getSupabaseAdmin();

/**
 * Middleware para verificar token de dueño
 * El token se pasa como query param ?token= o header X-Owner-Token
 */
function verifyOwnerToken(req: Request, res: Response, next: () => void) {
  const token = req.query.token as string || req.headers['x-owner-token'] as string;

  if (!token || token !== env.OWNER_TOKEN) {
    logger.warn({ ip: req.ip, path: req.path }, 'Owner command rejected - invalid token');
    return res.status(403).json({ error: 'Token de dueño inválido' });
  }

  next();
}

/**
 * GET /owner/command/status - Estado del sistema
 */
router.get('/owner/command/status', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, name, vertical, created_at, active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: messages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true });

  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    tenants: tenants?.length || 0,
    totalMessages: messages || 0,
    realMessagesEnabled: env.ENABLE_REAL_MESSAGES,
    whatsappProvider: env.WHATSAPP_PROVIDER,
    uptime: process.uptime(),
  });
}));

/**
 * POST /owner/command/pause - Pausar envío automático
 */
router.post('/owner/command/pause', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  await supabase.from('settings').upsert({
    key: 'auto_send_paused',
    value: 'true',
    type: 'boolean',
    description: 'Pausado por dueño',
  }, { onConflict: 'key' });

  logger.warn('Owner paused automatic messages');
  res.json({ status: 'paused', message: 'Envío automático pausado' });
}));

/**
 * POST /owner/command/resume - Reanudar envío automático
 */
router.post('/owner/command/resume', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  await supabase.from('settings').upsert({
    key: 'auto_send_paused',
    value: 'false',
    type: 'boolean',
  }, { onConflict: 'key' });

  logger.info('Owner resumed automatic messages');
  res.json({ status: 'resumed', message: 'Envío automático reanudado' });
}));

/**
 * POST /owner/command/broadcast - Enviar broadcast (solo plantillas)
 */
router.post('/owner/command/broadcast', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  const { templateName, variables, tenantIds } = req.body;

  if (!templateName) {
    throw new AppError('templateName requerido', 400, 'MISSING_TEMPLATE');
  }

  // TODO: Implementar lógica de broadcast con validación de ventana
  logger.info({ templateName, tenantIds }, 'Broadcast requested by owner');
  res.json({ status: 'queued', message: 'Broadcast encolado (implementación pendiente)' });
}));

/**
 * GET /owner/command/logs - Ver logs recientes
 */
router.get('/owner/command/logs', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  const { lines = 100, level } = req.query;
  // TODO: Implementar lectura de logs
  res.json({ status: 'ok', message: 'Logs no implementados aún', lines: Number(lines) });
}));

export const ownerCommandRouter = router;