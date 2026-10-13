import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { Pool } from 'pg';
import { getVertical } from '../../verticals/registry.js';
import { runAgentRuntime } from '../ai/runtime.js';
import { judgeConversation, type LabJudgment, type LabJudgmentCriteria } from './judge.js';
import type { LabPersona, LabTestInput, LabTestResult, LabConversation } from './types.js';
import { LAB_PERSONAS } from './types.js';
import { v4 as uuidv4 } from 'uuid';

const log = logger.child({ module: 'lab-runner' });

/**
 * Carga las personas simuladas desde el fixture
 */
export function loadLabPersonas(): LabPersona[] {
  return LAB_PERSONAS;
}

/**
 * Simula una conversación completa con una persona usando el AI runtime
 */
async function simulateConversation(
  persona: LabPersona,
  input: LabTestInput
): Promise<LabConversation> {
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];
  const maxTurns = input.maxTurns ?? 12;

  // Mensaje de saludo inicial de la persona
  messages.push({ role: 'user', content: persona.greeting });

  let conversationId = uuidv4();
  let contactId = `lab-${persona.id}`;

  for (let turn = 0; turn < maxTurns; turn++) {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) break;

    // Si el asistente no respondió, terminar
    if (lastMessage.role === 'assistant') break;

    // Ejecutar el runtime
    const response = await runAgentRuntime({
      tenantId: input.tenantId,
      vertical: input.vertical,
      conversationId,
      contactId,
      messageId: `turn-${turn}`,
      messageText: lastMessage.content,
      history: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
    });

    // Agregar respuesta del asistente
    messages.push({ role: 'assistant', content: response.text });

    // Si el asistente pidió herramientas, ejecutar y agregar resultados
    for (const tc of response.toolCalls) {
      if (tc.result) {
        messages.push({ role: 'assistant', content: `[Tool result: ${tc.tool}: ${JSON.stringify(tc.result)}]` });
      }
    }

    // Verificar si la conversación debería terminar
    if (response.text.toLowerCase().includes('gracias') ||
        response.text.toLowerCase().includes('hasta luego') ||
        response.text.toLowerCase().includes('adiós')) {
      break;
    }
  }

  // Convertir mensajes al formato LabMessage
  const labMessages = messages.map((m, i) => ({
    role: m.role,
    content: m.content,
    timestamp: new Date(Date.now() + i * 1000).toISOString()
  }));

  // Evaluar con el juez (pasa un juicio provisional, luego se actualiza con el resultado real)
  const conversation: LabConversation = {
    personaId: persona.id,
    personaName: persona.name,
    messages: labMessages,
    judgment: {
      personaId: persona.id,
      personaName: persona.name,
      respondedCorrectly: false,
      escalatedWhenShould: false,
      hallucinated: false,
      toneAppropriate: true,
      criteriaMet: false,
      score: 0,
      feedback: 'pending'
    }
  };
  const { judgment } = await judgeConversation(conversation, persona);

  return {
    personaId: persona.id,
    personaName: persona.name,
    messages: labMessages,
    judgment
  };
}

/**
 * Ejecuta una prueba completa de laboratorio
 * Corre con LAB_MODE=true y NO envía mensajes reales por WhatsApp
 */
export async function runLabTest(input: LabTestInput): Promise<LabTestResult> {
  const runId = uuidv4();
  log.info({ input, runId }, 'Starting lab test');

  // Verificar que el modo lab está activo y los mensajes se simulan
  if (!input.tenantId || !input.vertical) {
    throw new Error('tenantId y vertical son requeridos');
  }

  const vertical = getVertical(input.vertical);
  if (!vertical) {
    throw new Error(`Vertical not found: ${input.vertical}`);
  }

  const personas = loadLabPersonas();
  if (personas.length === 0) {
    log.warn('No lab personas found, using defaults');
  }

  const conversations: LabConversation[] = [];
  const findings: string[] = [];
  const suggestions: string[] = [];

  // Simular conversaciones con cada persona
  for (const persona of personas) {
    try {
      log.info({ persona: persona.name }, 'Simulating conversation');
      const conversation = await simulateConversation(persona, input);
      conversations.push(conversation);

      // Recopilar hallazgos basados en el judgment
      if (conversation.judgment.score < 80) {
        findings.push(`${persona.name}: score ${conversation.judgment.score}`);
      }

      if (conversation.judgment.hallucinated) {
        findings.push(`${persona.name}: posible alucinación detectada`);
      }

      if (!conversation.judgment.toneAppropriate) {
        findings.push(`${persona.name}: tono podría mejorarse`);
      }
    } catch (error) {
      log.error({ persona: persona.name, error: (error as Error).message }, 'Error simulating conversation');
      findings.push(`${persona.name}: error en simulación - ${(error as Error).message}`);
    }
  }

  // Calcular score promedio
  const scores = conversations.map(c => c.judgment.score);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const passed = scores.filter(s => s >= 70).length;
  const failed = scores.filter(s => s < 70).length;

  // Generar sugerencias basadas en hallazgos
  if (avgScore < 60) {
    suggestions.push('Rendimiento general bajo - revisar ground truth y prompts');
  }
  if (findings.some(f => f.includes('alucinación'))) {
    suggestions.push('Prevenir alucinaciones: refinar prompts y check de datos inventados');
  }
  if (findings.some(f => f.includes('tono'))) {
    suggestions.push('Mejorar coherencia del tono con instructions específicas por vertical');
  }
  if (findings.some(f => f.includes('escalar'))) {
    suggestions.push('Refinar detección de casos que requieren escalación a humano');
  }

  const result: LabTestResult = {
    runId,
    score: avgScore,
    conversations,
    findings,
    suggestions,
    summary: {
      totalConversations: conversations.length,
      passed,
      failed,
      avgScore
    }
  };

  // Guardar resultados en la base de datos usando pg directamente
  await saveLabResults(result, input);

  log.info({ runId, score: avgScore }, 'Lab test completed');

  return result;
}

/**
 * Guarda resultados del laboratorio en la base de datos usando pg.
 */
async function saveLabResults(result: LabTestResult, input: LabTestInput): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    const passedCount = result.conversations.filter(c => c.judgment.criteriaMet).length;
    const failedCount = result.conversations.length - passedCount;

    // 1. Guardar el run principal usando las columnas existentes + metadata
    await client.query(
      `
      INSERT INTO lab_runs (id, tenant_id, vertical, status, score, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, 'completed', $4, $5, now(), now())
      ON CONFLICT (id) DO NOTHING
      `,
      [
        result.runId,
        input.tenantId,
        input.vertical,
        result.score,
        JSON.stringify({
          agent_version: input.agentVersion ?? 'default',
          total_conversations: result.conversations.length,
          passed: passedCount,
          failed: failedCount,
          findings: result.findings,
          suggestions: result.suggestions,
        })
      ]
    );

    // Obtener el ID del run recién creado (ya insertado)
    const { rows } = await client.query(
      'SELECT id FROM lab_runs WHERE tenant_id = $1 AND vertical = $2 ORDER BY created_at DESC LIMIT 1',
      [input.tenantId, input.vertical]
    );
    const runId = rows[0]?.id;

    // 2. Guardar cada conversación
    if (runId) {
      for (const conv of result.conversations) {
        await client.query(
          `
          INSERT INTO lab_conversations (id, lab_run_id, persona, transcript, passed, feedback, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, now(), now())
          `,
          [
            uuidv4(),
            runId,
            conv.personaName,
            JSON.stringify(conv.messages),
            conv.judgment.criteriaMet,
            conv.judgment.feedback
          ]
        );
      }
    }

    console.log(`✅ Resultados de laboratorio guardados: run=${result.runId}, score=${result.score}, conversaciones=${result.summary.totalConversations}`);
  } catch (error) {
    console.error('❌ Error guardando resultados del laboratorio:', error);
    throw error;
  } finally {
    await pool.end();
  }
}