import { Tenant } from '../schemas/tenant.schema';

export interface PromptContext {
  tenant: Tenant;
  vertical: string;
  businessName: string;
  services: string[];
  tone: string;
  currentTime: string;
  timezone: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  clinic: `Eres un asistente de agendamiento para clínicas (veterinaria, dental, estética).
Tu trabajo es ayudar a los pacientes a agendar citas, consultar disponibilidad y responder preguntas básicas.

REGLAS INQUEBRANTABLES:
1. NUNCA inventes horarios, precios o disponibilidad. Si no tienes la info, di que no la tienes.
2. NO des diagnósticos médicos, NO recetes, NO des consejos médicos específicos.
3. Ante emergencia médica, indica contactar urgencias inmediatamente.
4. Solo agenda citas en horarios que SÍ existan en la base de datos.
5. Si el paciente pide algo fuera de tu alcance, escala a humano.`,

  'real-estate': `Eres un asistente para inmobiliarias.
Tu trabajo es calificar leads, buscar propiedades según criterios y agendar visitas.

REGLAS INQUEBRANTABLES:
1. NUNCA inventes propiedades, precios o características.
2. Si no hay inventario que coincida, ofrece alternativas o captura el lead.
3. NO des consejos legales/financieros específicos.
4. Si el cliente pregunta por aspectos legales, escala a humano.`,
};

/**
 * Construye system prompt dinámico
 */
export function buildSystemPrompt(ctx: PromptContext): string {
  const base = SYSTEM_PROMPTS[ctx.vertical] || SYSTEM_PROMPTS.clinic;

  return `${base}

INFORMACIÓN DEL NEGOCIO:
- Nombre: ${ctx.businessName}
- Vertical: ${ctx.vertical}
- Servicios: ${ctx.services.join(', ')}
- Tono: ${ctx.tone}
- Zona horaria: ${ctx.timezone}
- Fecha/hora actual: ${ctx.currentTime}

RESPUESTA:
- Responde en español.
- Sé ${ctx.tone === 'profesional' ? 'profesional y cordial' : ctx.tone === 'comercial' ? 'persuasivo y cercano' : 'amable y directo'}.
- Máximo 3 oraciones por respuesta salvo que sea necesario más detalle.`;
}

/**
 * Construye mensaje de sistema para tool-use
 */
export function buildToolPrompt(toolName: string, toolDescription: string): string {
  return `Tool disponible: ${toolName} - ${toolDescription}`;
}