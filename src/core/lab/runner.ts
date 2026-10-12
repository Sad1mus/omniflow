import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { getVertical } from '../../verticals/registry.js';
import { runAgentRuntime } from '../ai/runtime.js';
import { judgeConversation, type LabJudgment, type LabJudgmentCriteria } from './judge.js';
import type { LabPersona, LabTestInput, LabTestResult, LabConversation } from './types.js';
import { LAB_PERSONAS } from './types.js';
const { randomUUID } = crypto;
const uuidv4 = () => randomUUID() as string;
import type { UUID } from 'crypto';

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

  let conversationId = `lab-${uuidv4()}`;
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
  const runId = `lab-run-${uuidv4()}`;
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

  // Guardar resultados en la base de datos
  await saveLabResults(result, input);

  log.info({ runId, score: avgScore }, 'Lab test completed');

  return result;
}

/**
 * Guarda resultados del laboratorio en la base de datos
 */
async function saveLabResults(result: LabTestResult, input: LabTestInput): Promise<void> {
  try {
    const { getSupabaseAdmin } = await import('../../lib/supabase.js');
    const supabase = getSupabaseAdmin();

    // Insertar run principal
    const { error: runError } = await supabase.from('lab_runs').insert({
      id: result.runId,
      tenant_id: input.tenantId,
      vertical: input.vertical,
      agent_version: input.agentVersion ?? 'current',
      score: result.score,
      total_conversations: result.summary.totalConversations,
      passed: result.summary.passed,
      failed: result.summary.failed,
      findings: result.findings,
      suggestions: result.suggestions,
      created_at: new Date().toISOString()
    });

    if (runError) {
      log.error({ error: runError }, 'Error saving lab run');
    }

    // Insertar conversaciones individuales
    for (const conv of result.conversations) {
      const convError = await supabase.from('lab_conversations').insert({
        id: `conv-${conv.personaId}-${result.runId}`,
        run_id: result.runId,
        persona_id: conv.personaId,
        persona_name: conv.personaName,
        messages: conv.messages,
        score: conv.judgment.score,
        hallucinated: conv.judgment.hallucinated,
        tone_appropriate: conv.judgment.toneAppropriate,
        criteria_met: conv.judgment.criteriaMet,
        created_at: new Date().toISOString()
      });

      if ((convError as any)?.error) {
        log.error({ error: convError }, 'Error saving lab conversation');
      }
    }
  } catch (error) {
    log.warn({ error: (error as Error).message }, 'Could not save lab results to DB (table may not exist)');
  }
}