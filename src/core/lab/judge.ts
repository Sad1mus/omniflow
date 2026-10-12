import { logger } from '../../lib/logger';
import { env } from '../../config/env';
import { createChatCompletionWithFallback, type ChatCompletionMessage } from '../../lib/openrouter';
import type { LabConversation } from './types';

const log = logger.child({ module: 'lab-judge' });

export interface LabJudgmentCriteria {
  respondedCorrectly: boolean;
  escalatedWhenShould: boolean;
  hallucinated: boolean;
  toneAppropriate: boolean;
  criteriaMet: boolean;
}

export interface LabJudgment {
  personaId: string;
  personaName: string;
  respondedCorrectly: boolean;
  escalatedWhenShould: boolean;
  hallucinated: boolean;
  toneAppropriate: boolean;
  criteriaMet: boolean;
  score: number;
  feedback: string;
}

/**
 * Evalúa una conversación simulada usando un juez LLM
 * @param conversation La conversación para evaluar
 * @param persona La persona simulada que interactuó
 * @returns Evaluación detallada con feedback
 */
export async function judgeConversation(
  conversation: LabConversation,
  persona: any // LabPersona from fixture
): Promise<{ judgment: LabJudgment; feedback: string }> {
  // Construir el prompt para el juez
  const messages: ChatCompletionMessage[] = [
    {
      role: 'system',
      content: `Eres un juez experto en evaluar asistentes de IA para clínicas y negocios.
      Tu tarea es evaluar objetivamente una conversación entre un asistente y un cliente simulado.

      Criterios de evaluación (cada uno vale 20 puntos):
      1. Respondió correctamente: ¿El asistente entendió la intención del usuario y dio una respuesta apropiada?
      2. Escaló cuando debía: ¿Identificó correctamente cuándo era necesario transferir a un humano?
      3. No alucinó: ¿Evito inventar información como precios, disponibilidad o diagnósticos que no estaban en su conocimiento?
      4. Tono apropiado: ¿Mantuvo un tono profesional y adecuado para el contexto del negocio?
      5. Cumplió criterios de éxito: ¿Cumplió con los objetivos específicos definidos para esta persona?

      Para cada criterio, indica si se cumple (true/false) y proporciona una breve explicación.
      Al final, calcula un score total de 0-100 basado en el porcentaje de criterios cumplidos.

      Responde SOLO en formato JSON válido con la siguiente estructura:
      {
        "respondedCorrectly": boolean,
        "escalatedWhenShould": boolean,
        "hallucinated": boolean,
        "toneAppropriate": boolean,
        "criteriaMet": boolean,
        "feedback": "Explicación detallada de la evaluación"
      }

      No incluyas texto adicional fuera del JSON.`
    },
    {
      role: 'user',
      content: `Evaluar esta conversación:

      PERSONA SIMULADA:
      - Nombre: ${persona.name}
      - Descripción: ${persona.description}
      - Personalidad: ${persona.persona}
      - Instrucciones para el asistente: ${persona.instructions}

      CONVERSACION:
      ${conversation.messages.map((m, i) => `${i + 1}. ${m.role === 'user' ? 'CLIENTE' : m.role === 'assistant' ? 'ASISTENTE' : 'SISTEMA'}: ${m.content}`).join('\n')}

      EVALUAR:`
    }
  ];

  try {
const response = await createChatCompletionWithFallback(
      {
        messages,
        temperature: 0.3,
        max_tokens: 500,
        model: env.DEFAULT_MODEL,
      },
      env.DEFAULT_MODEL,
      env.FALLBACK_MODEL
    );

    const content = response.choices[0]?.message?.content ?? '{}';
    let judgment: Partial<LabJudgmentCriteria> & { feedback: string };

    try {
      judgment = JSON.parse(content);
    } catch (e: unknown) {
      const err = e as Error;
      log.warn({ error: err.message, content }, 'Failed to parse judge response as JSON');
      // Fallback: crear una evaluación básica basada en heurísticas
      judgment = {
        respondedCorrectly: conversation.messages.some(m => m.role === 'assistant' && m.content.length > 10),
        escalatedWhenShould: false, // No podemos determinar esto fácilmente sin contexto
        hallucinated: conversation.messages.some(m =>
          m.role === 'assistant' &&
          /\$\s?\d|precio|costo|diagnóstico|receto|horario.*\d{1,2}:\d{2}/i.test(m.content)
        ),
        toneAppropriate: true, // Asumimos apropiado por defecto
        criteriaMet: false, // No podemos determinar sin success criteria específicos
        feedback: 'Evaluación automática de fallback debido a error de parsing del juez LLM'
      };
    }

    // Calcular score basado en criterios booleanos
    const criteriaValues = Object.values(judgment).filter(v => typeof v === 'boolean');
    const score = Math.round((criteriaValues.filter(v => v === true).length / criteriaValues.length) * 100);

    const labJudgment: LabJudgment = {
      personaId: conversation.personaId,
      personaName: conversation.personaName,
      respondedCorrectly: !!judgment.respondedCorrectly,
      escalatedWhenShould: !!judgment.escalatedWhenShould,
      hallucinated: !!judgment.hallucinated,
      toneAppropriate: !!judgment.toneAppropriate,
      criteriaMet: !!judgment.criteriaMet,
      score,
      feedback: judgment.feedback
    };

    return { judgment: labJudgment, feedback: judgment.feedback };
  } catch (error: unknown) {
    const err = error as Error;
    log.error({ error: err.message }, 'Error in judge conversation');
    // En caso de error total, retornar una evaluación conservadora
    return {
      judgment: {
        personaId: conversation.personaId,
        personaName: conversation.personaName,
        respondedCorrectly: false,
        escalatedWhenShould: false,
        hallucinated: true, // Asumimos riesgo de alucinación
        toneAppropriate: false,
        criteriaMet: false,
        score: 0,
        feedback: `Error ejecutando el juez: ${err.message}`
      },
      feedback: `Error ejecutando el juez: ${err.message}`
    };
  }
}