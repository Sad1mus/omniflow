import { Router, Request, Response } from 'express';
import { asyncHandler } from '../lib/errors';
import { env } from '../config/env';

import { createConversationMemory, addMessage, getContextMessages } from '../core/ai/memory';
import { safeExecute } from '../core/ai/tool-executor';
import { evaluateEscalation } from '../core/ai/escalation';

import { MetaVerifySchema, MetaMessageSchema } from '../core/schemas/webhook.schema';

const router = Router();

/**
 * POST /lab/run - Ejecutar laboratorio de IA con escenarios simulados
 *
 * Body:
 * {
 *   personaId: string,
 *   scenarioId: string,
 *   message: string
 * }
 */
router.post('/lab/run', asyncHandler(async (req: Request, res: Response) => {
  const { personaId, scenarioId, message } = req.body;

  if (!personaId || !scenarioId || !message) {
    throw new Error('personaId, scenarioId y message son requeridos');
  }

  // Verificar que la ventana de 24h está cerrada o que está permitido enviar
  const canSend = env.ENABLE_REAL_MESSAGES || false;
  if (!canSend) {
    return res.status(403).json({
      status: 'blocked',
      reason: 'Laboratorio en modo seguro - no se envían mensajes reales',
    });
  }

  // Cargar persona simulada
  const personaModule = await import('../../tests/fixtures/lab/personas.json');
  const personas = (personaModule.default || personaModule) as Array<{ id: string; name: string; description: string; persona: string; greeting: string; instructions: string; farewell: string }>;
  const persona = personas.find((p: any) => p.id === personaId);

  if (!persona) {
    return res.status(404).json({ status: 'error', message: 'Persona not found' });
  }

  // Ejecutar decisión de escalación
  const { shouldEscalate, reason, urgency } = evaluateEscalation(
    message,
    'text' as any  // TODO: pasar intent si está disponible
  );

  // Construir contexto del sistema para la IA
  const systemPrompt = `
    Eres un agente de WhatsApp para un agente de servicio.
    Vertical: clínica veterinaria.
    No inventes datos (precios, fechas, disponibilidad, diagnósticos).
    Responde en español.
  `;

  // Ejecutar el prompt con tool-use (sandbox seguro)
  const toolResult = await safeExecute({
    name: 'lab:run',
    description: `Ejecutar laboratorio con persona ${personaId}`,
    parameters: { personaId, scenarioId, message, systemPrompt },
    // Esta será implementada con tool-use real
  });

  return res.json({
    status: 'completed',
    personaId,
    scenarioId,
    message,
    escalation: {
      shouldEscalate,
      reason,
      urgency,
    },
    systemPrompt,
  });
}));

/**
 * GET /lab/personas - Listar personas de laboratorio
 */
router.get('/personas', async (req, res) => {
  const personaModule = await import('../../tests/fixtures/lab/personas.json');
  const personas = (personaModule.default || personaModule) as Array<{ id: string; name: string; description: string; persona: string; greeting: string; instructions: string; farewell: string }>;
  const persona001 = personas.find((p: any) => p.id === '00000000-0000-0000-0000-000000000001');

  if (!persona001) {
    return res.status(500).json({ status: 'error', message: 'Personas not found' });
  }

  res.json({ status: 'ok', personas });
});

/**
 * POST /lab/test - Test rápido de pipeline de IA
 */
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;

  const result = await safeExecute({
    name: 'lab:test',
    description: 'Test pipeline IA rápido',
    parameters: { message },
  });

  return res.json({
    status: 'ok',
    result,
  });
}));

export const labRouter = router;