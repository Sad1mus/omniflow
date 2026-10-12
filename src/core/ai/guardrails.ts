import { logger } from '../../lib/logger.js';
import { redactPII } from '../security/pii.js';

const log = logger.child({ module: 'guardrails' });

export interface GuardrailsContext {
  tenantId: string;
  vertical: string;
  input: string;
  output: string;
  toolCalls: Array<{ tool: string; args: Record<string, unknown>; result: unknown }>;
  contactId: string;
}

export interface GuardrailsResult {
  blocked: boolean;
  reason?: string;
  sanitizedOutput?: string;
  fallbackText?: string;
  escalated: boolean;
}

/**
 * Patrones para detectar emergencias médicas
 * Cobertura: emergencias vitales, síntomas de alerta, requerimientos de atención inmediata
 */
const MEDICAL_EMERGENCY_PATTERNS: RegExp[] = [
  /\bemergencia\b/i,
  /\burgencia\b/i,
  /\bno respira\b/i,
  /\bconvulsi[oó]n\b/i,  // convulsión = convulsi-ó-n (i before ó)
  /\bdesmayo\b/i,
  /\bataque\b/i,
  /\binfarto\b/i,
  /\bsangrado abundante\b/i,
  /\bdolor muy fuerte\b/i,
  /\bparo card[ií]aco[rrespiratorio]\b/i,
  /\basfixia\b/i,
  /\binsuficiencia respiratoria\b/i,
  /\bshock\b/i,
  /\binconsciente\b/i,
];

/**
 * Patrones para detectar inyección de prompt / prompt injection
 * Cobertura: intentos de anular instrucciones, revelar system prompt, roleplay malicioso
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignora (tus|las) (instrucciones|reglas)/i,
  /olvida (tus|las) (instrucciones|reglas)/i,
  /ahora eres/i,
  /act[úu]a como si/i,
  /system\s*:/i,
  /<\|?\s*sys(?:ment)?\s*\|?>/i,
  /<<SYS>>/i,
  /revela tus instrucciones/i,
  /muestra tus instrucciones/i,
  /cu[aá]les son tus (instrucciones|reglas|prompts)/i,
  /ignore.*previous/i,
  /forget.*previous/i,
  /new.*instructions/i,
  /you are now/i,
  /roleplay/i,
  /simulate/i,
  /pretend/i,
];

/**
 * Patrones para detectar consejos sensibles (médicos, legales, financieros)
 * Cobertura: diagnóstico, prescripción, asesoría legal, acciones legales
 */
const SENSITIVE_ADVICE_PATTERNS: RegExp[] = [
  /\brecetar\b/i,
  /\bdiagnosticar\b/i,
  /\bprescribir\b/i,
  /\btomar para\b/i,
  /\bdosis de\b/i,
  /\bmedicamento\b/i,
  /\btratamiento\b/i,
  /\bdemandar\b/i,
  /\bdenunciar\b/i,
  /\basesor[ií]a legal\b/i,
  /\bconsejo legal\b/i,
  /\babogado\b/i,
  /\bjuicio\b/i,
  /\bdemanda\b/i,
  /\basesor[ií]a financiera\b/i,
  /\binversi[oó]n\b/i,
  /\bpr[ée]stamo\b/i,
  /\bhipoteca\b/i,
];

/**
 * Patrones para detectar precios inventados (sin tool calls)
 * Nota: sin bandera 'g' para evitar estado lastIndex en .test()
 */
const PRICE_PATTERNS: RegExp[] = [
  /\$\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/i,
  /USD\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/i,
  /EUR\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/i,
  /€\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/i,
  /MXN\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/i,
  /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s*(?:pesos|d[oó]lares|euros)\b/i,
  /precio:?\s*\d+/i,
  /costo:?\s*\d+/i,
];

/**
 * Patrones para detectar fechas/horas específicas inventadas (sin tool calls)
 * Nota: sin bandera 'g' para evitar estado lastIndex en .test()
 */
const DATETIME_PATTERNS: RegExp[] = [
  /\d{1,2}:\d{2}\s*(?:am|pm|a\.?m\.?|p\.?m\.?)/i,
  /\d{1,2}:\d{2}/i,
  /\d{1,2}\/\d{1,2}\/\d{2,4}/i,
  /\d{4}-\d{2}-\d{2}/i,
  /(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{1,2}/i,
  /(?:lunes|martes|mi[éè]rcoles|jueves|viernes|s[aá]bado|domingo)\s+\d{1,2}/i,
  /mañana\s+a\s+las/i,
  /pasado ma[ñn]ana\s+a\s+las/i,
];

/**
 * Verifica si algún patrón coincide en el texto
 */
function matchesAny(text: string, patterns: RegExp[]): RegExp | null {
  for (const p of patterns) if (p.test(text)) return p;
  return null;
}

/**
 * Verifica si algún patrón coincide en el texto (versión booleana)
 * Crea instancias frescas para evitar estado lastIndex
 */
function matchesAnyGlobal(text: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(text));
}

/**
 * Aplica los guardrails de seguridad a una respuesta del asistente
 * Retorna un resultado que indica si la respuesta debe bloquearse y la acción a tomar
 */
export function applyGuardrails(ctx: GuardrailsContext): GuardrailsResult {
  // 1. Detección de emergencias médicas en el INPUT del usuario
  const emergencyMatch = matchesAny(ctx.input, MEDICAL_EMERGENCY_PATTERNS);
  if (emergencyMatch) {
    log.warn({ tenantId: ctx.tenantId, pattern: emergencyMatch.source }, 'Medical emergency detected');
    return {
      blocked: true,
      reason: 'medical_emergency',
      escalated: true,
      fallbackText: 'Entiendo que esto es urgente. Por favor contacta inmediatamente a servicios de emergencia o acude al centro médico más cercano. Nuestro equipo te atenderá en cuanto sea posible.',
    };
  }

  // 2. Detección de inyección de prompt en el INPUT del usuario
  const injectionMatch = matchesAny(ctx.input, INJECTION_PATTERNS);
  if (injectionMatch) {
    log.warn({ tenantId: ctx.tenantId, pattern: injectionMatch.source }, 'Prompt injection detected');
    return {
      blocked: true,
      reason: 'prompt_injection',
      escalated: false,
      fallbackText: 'Lo siento, no puedo procesar esa solicitud. ¿En qué más puedo ayudarte?',
    };
  }

  // 3. Detección de consejos sensibles en la SALIDA del asistente
  const sensitiveMatch = matchesAny(ctx.output, SENSITIVE_ADVICE_PATTERNS);
  if (sensitiveMatch) {
    log.warn({ tenantId: ctx.tenantId, pattern: sensitiveMatch.source }, 'Sensitive advice detected');
    return {
      blocked: true,
      reason: 'sensitive_advice',
      escalated: true,
      fallbackText: 'Esa consulta requiere atención personalizada de un profesional. Déjame transferirte con alguien de nuestro equipo.',
    };
  }

  // 4. Detección de datos inventados (precios/fechas sin tool calls)
  const hasToolCalls = ctx.toolCalls.length > 0;
  if (!hasToolCalls) {
    const hasPrice = matchesAnyGlobal(ctx.output, PRICE_PATTERNS);
    const hasDatetime = matchesAnyGlobal(ctx.output, DATETIME_PATTERNS);

    if (hasPrice || hasDatetime) {
      log.warn({ tenantId: ctx.tenantId, hasPrice, hasDatetime }, 'Fabricated data detected (no tool calls)');
      return {
        blocked: true,
        reason: 'fabricated_data',
        escalated: false,
        fallbackText: 'Déjame verificar esa información con mi equipo. Un momento por favor.',
      };
    }
  }

  // 5. Sanitización de PII en la salida (siempre aplicar)
  const sanitizedOutput = redactPII(ctx.output);

  return { blocked: false, sanitizedOutput, escalated: false };
}