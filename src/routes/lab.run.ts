import { Router, Request, Response } from 'express';
import { asyncHandler } from '../lib/errors.js';
import { authOwner } from '../middleware/auth-owner.js';
import { runLabTest } from '../core/lab/runner.js';

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
 * Requiere autenticación de owner via X-Owner-Token header o ?token= query param
 * Retorna LabTestResult completo con score, conversaciones y suggestions.
 */
router.post('/run', authOwner, asyncHandler(async (req: Request, res: Response) => {
  const { tenantId, vertical, maxTurns, agentVersion } = req.body;

  if (!tenantId || !vertical) {
    return res.status(400).json({
      error: 'tenantId y vertical son requeridos',
      missing: ['tenantId', 'vertical'].filter(k => !req.body[k])
    });
  }

  const result = await runLabTest({
    tenantId,
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