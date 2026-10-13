import { Router, Request, Response } from 'express';

import { env } from '../config/env';
import { logger } from '../lib/logger';
import { asyncHandler, AppError } from '../lib/errors';
import { getSupabaseAdmin } from '../lib/supabase';
import { handleHoy, handleSemana, handleEditar, handleMetrics } from '../core/owner-commands/handlers';

const router = Router();

/**
 * Cliente Supabase lazy: se instancia solo al primer uso (dentro de un handler),
 * no en load del módulo. Evita que el servidor falle al arrancar si SUPABASE_URL
 * no está en .env de desarrollo.
 */
function getSupabaseClient() {
  return getSupabaseAdmin();
}

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
  const supabase = getSupabaseClient();
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
  await getSupabaseClient().from('settings').upsert({
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
  await getSupabaseClient().from('settings').upsert({
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

/**
 * POST /owner/command/metrics - Métricas semanales resumidas
 */
router.post('/owner/command/metrics', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.body;
  if (!tenantId) {
    throw new AppError('tenantId es requerido', 400, 'MISSING_TENANT');
  }

  const response = await handleMetrics(tenantId);
  logger.info({ tenantId }, 'Owner metrics command executed');
  res.json({ command: 'metrics', response });
}));

/**
 * POST /owner/command/hoy - Resumen diario del día
 */
router.post('/owner/command/hoy', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.body;
  if (!tenantId) {
    throw new AppError('tenantId es requerido', 400, 'MISSING_TENANT');
  }

  const response = await handleHoy(tenantId);
  logger.info({ tenantId }, 'Owner hoy command executed');
  res.json({ command: 'hoy', response });
}));

/**
 * POST /owner/command/semana - Reporte semanal
 */
router.post('/owner/command/semana', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.body;
  if (!tenantId) {
    throw new AppError('tenantId es requerido', 400, 'MISSING_TENANT');
  }

  const response = await handleSemana(tenantId);
  logger.info({ tenantId }, 'Owner semana command executed');
  res.json({ command: 'semana', response });
}));

/**
 * POST /owner/command/editar - Actualizar información del conocimiento
 */
router.post('/owner/command/editar', verifyOwnerToken, asyncHandler(async (req: Request, res: Response) => {
  const { tenantId, text } = req.body;
  if (!tenantId || !text) {
    throw new AppError('tenantId y text son requeridos', 400, 'MISSING_PARAMS');
  }

  const response = await handleEditar(tenantId, text);
  logger.info({ tenantId }, 'Owner editar command executed');
  res.json({ command: 'editar', response });
}));

export const ownerCommandRouter = router;