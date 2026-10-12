import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

/**
 * Middleware para verificar token de dueño
 * El token se pasa como query param ?token= o header X-Owner-Token
 */
export function authOwner(req: Request, res: Response, next: NextFunction) {
  const token = req.query.token as string || req.headers['x-owner-token'] as string;

  if (!token || token !== env.OWNER_TOKEN) {
    logger.warn({ ip: req.ip, path: req.path }, 'Owner command rejected - invalid token');
    return res.status(403).json({ error: 'Token de dueño inválido' });
  }

  next();
}