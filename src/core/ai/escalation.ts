import { Intent } from './intents';

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
}

const ESCALATION_RULES: Array<{
  condition: (text: string, intent: Intent) => boolean;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}> = [
  {
    condition: (text, intent) => intent === Intent.EMERGENCIA,
    reason: 'Emergencia médica detectada',
    urgency: 'critical',
    message: 'Ante una situación de emergencia, por favor contacta inmediatamente al centro de atención o al servicio de urgencias correspondiente.',
  },
  {
    condition: (text, intent) =>
      intent === Intent.SOLICITAR_HUMANO ||
      /\bhumano\b/i.test(text) ||
      /\bagente\b/i.test(text),
    reason: 'Cliente solicita atención humana',
    urgency: 'medium',
    message: 'Te voy a conectar con un agente humano que te atenderá personalmente.',
  },
  {
    condition: (text, intent) => intent === Intent.RECLAMO,
    reason: 'Reclamo detectado',
    urgency: 'medium',
    message: 'Voy a pasar tu caso con un agente humano para que lo resuelva personalmente.',
  },
  {
    condition: (text, intent) =>
      /\breceta\b/i.test(text) ||
      /\bmedicina\b/i.test(text) ||
      /\btratamiento\b/i.test(text) ||
      /\bdiagnóstico\b/i.test(text),
    reason: 'Solicitud de consejo médico',
    urgency: 'high',
    message: 'No puedo proporcionar consejos médicos específicos. Te recomiendo consultar con un profesional de la salud.',
  },
  {
    condition: (text, intent) =>
      /\blegal\b/i.test(text) ||
      /\bcontrato\b/i.test(text) ||
      /\babogado\b/i.test(text) ||
      /\bproceso\b/i.test(text),
    reason: 'Asunto legal',
    urgency: 'high',
    message: 'No puedo asesorar en asuntos legales. Te recomiendo consultar con un abogado especializado.',
  },
];

/**
 * Decide si el agente debe escalar a humano
 */
export function evaluateEscalation(
  text: string,
  intent: Intent
): EscalationDecision {
  for (const rule of ESCALATION_RULES) {
    if (rule.condition(text, intent)) {
      return {
        shouldEscalate: true,
        reason: rule.reason,
        urgency: rule.urgency,
        message: rule.message,
      };
    }
  }

  return {
    shouldEscalate: false,
  };
}