import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../lib/errors.js';
import { runLabTest } from '../core/lab/runner.js';

// Middleware: verificar JWT y extraer tenant_id
function authJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'omniflow-dev-jwt-secret-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      tenantId: string;
      tenantName: string;
      role: string;
      email: string;
    };

    // Adjuntar datos decodificados al request
    req.user = {
      tenantId: decoded.tenantId,
      tenantName: decoded.tenantName,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error('Error verificando JWT:', error);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

const router = Router();

/**
 * POST /api/lab/run - Ejecutar prueba de laboratorio de IA
 *
 * Body:
 * {
 *   tenantId: string,
 *   vertical: 'clinic' | 'real-estate',
 *   maxTurns?: number (default 12),
 *   agentVersion?: string
 * }
 *
 * Requiere JWT Bearer token. Extrae tenant_id del token decodificado.
 * Retorna LabTestResult completo con score, conversaciones y suggestions.
 */
router.post('/run', authJWT, asyncHandler(async (req: Request, res: Response) => {
  const { tenantId, vertical, maxTurns, agentVersion } = req.body;

  if (!tenantId || !vertical) {
    return res.status(400).json({
      error: 'tenantId y vertical son requeridos',
      missing: ['tenantId', 'vertical'].filter(k => !req.body[k])
    });
  }

  // Usar tenantId del JWT si no se proporciona en el body (o usar el del body)
  const effectiveTenantId = tenantId || req.user?.tenantId;

  if (!effectiveTenantId) {
    return res.status(400).json({ error: 'tenantId es requerido' });
  }

  const result = await runLabTest({
    tenantId: effectiveTenantId,
    vertical,
    maxTurns: maxTurns ?? 12,
    agentVersion
  });

  res.json(result);
}));

/**
 * GET /api/lab/personas - Listar personas de laboratorio disponibles
 */
router.get('/personas', asyncHandler(async (req, res) => {
  const { loadLabPersonas } = await import('../core/lab/runner.js');
  const personas = loadLabPersonas();

  res.json({ personas: personas.map(p => ({ id: p.id, name: p.name, description: p.description })) });
}));

/**
 * GET /api/lab/status - Verificar estado del laboratorio
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    labMode: process.env.LAB_MODE === 'true',
    realMessagesEnabled: process.env.ENABLE_REAL_MESSAGES === 'true',
    personasCount: 6
  });
});

export const labRouter = router;