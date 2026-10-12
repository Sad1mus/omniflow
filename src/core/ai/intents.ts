import { z } from 'zod';

export enum Intent {
  AGENDAR = 'agendar',
  CONSULTAR_PRECIO = 'consultar_precio',
  CONSULTAR_DISPONIBILIDAD = 'consultar_disponibilidad',
  EMERGENCIA = 'emergencia',
  RECLAMO = 'reclamo',
  SOLICITAR_HUMANO = 'solicitar_humano',
  COMANDO_OWNER = 'comando_owner',
  FUERA_DE_ALCANCE = 'fuera_de_alcance',
  CONFIRMACION = 'confirmacion',
  CANCELACION = 'cancelacion',
  REAGENDAR = 'reagendar',
  RECONOCIMIENTO = 'reconocimiento',
}

export interface IntentMatch {
  intent: Intent;
  confidence: number; // 0-1
  entities?: Record<string, unknown>;
}

const INTENT_PATTERNS: Record<Intent, RegExp[]> = {
  [Intent.AGENDAR]: [
    /\bagendar\b/i,
    /\bcita\b/i,
    /\breservar\b/i,
    /\bhorario\b/i,
    /\bhora\b/i,
  ],
  [Intent.CONSULTAR_PRECIO]: [
    /\bprecio\b/i,
    /\bcuesto\b/i,
    /\bvalor\b/i,
    /\bcosto\b/i,
  ],
  [Intent.CONSULTAR_DISPONIBILIDAD]: [
    /\bdisponible\b/i,
    /\bdisponibilidad\b/i,
    /\bhorario\b/i,
    /\btienes\b.*\bhora\b/i,
  ],
  [Intent.EMERGENCIA]: [
    /\bemergencia\b/i,
    /\burgencias\b/i,
    /\benci[oa]n\b/i,
    /\bmuerte\b/i,
    /\bgrave\b/i,
    /\bimportante\b/i,
  ],
  [Intent.RECLAMO]: [
    /\breclamo\b/i,
    /\bqueja\b/i,
    /\bproblema\b/i,
    /\bno me satisface\b/i,
    /\bmalo\b/i,
    /\bhorrible\b/i,
  ],
  [Intent.SOLICITAR_HUMANO]: [
    /\bhumano\b/i,
    /\bagente\b/i,
    /\bpersona\b/i,
    /\batendedor\b/i,
    /\bvendedor\b/i,
  ],
  [Intent.COMANDO_OWNER]: [
    /^\/[a-z]+/i,
  ],
  [Intent.FUERA_DE_ALCANCE]: [/.*/i], // fallback
  [Intent.CONFIRMACION]: [
    /\bs[ií]\b/i,
    /\bconfirmo\b/i,
    /\bdale\b/i,
    /\bperfecto\b/i,
  ],
  [Intent.CANCELACION]: [
    /\bcancelar\b/i,
    /\bno puedo\b/i,
    /\bno voy\b/i,
  ],
  [Intent.REAGENDAR]: [
    /\breagendar\b/i,
    /\bCambiar\b/i,
    /\botro d[ií]a\b/i,
    /\botra hora\b/i,
  ],
  [Intent.RECONOCIMIENTO]: [
    /\bgracias\b/i,
    /\bmuchas\b/i,
    /\bte quiero\b/i,
  ],
};

/**
 * Detecta el intent principal de un mensaje
 */
export function detectIntent(text: string): IntentMatch {
  const scores: Partial<Record<Intent, number>> = {};
  const lowerText = text.toLowerCase();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(lowerText)) {
        score += 1;
      }
    }
    scores[intent as Intent] = score / patterns.length;
  }

  // Encontrar el intent con mayor score
  let bestIntent: Intent = Intent.FUERA_DE_ALCANCE;
  let bestScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score && score > bestScore) {
      bestScore = score;
      bestIntent = intent as Intent;
    }
  }

  // Si es comando owner, priorizar
  if (scores[Intent.COMANDO_OWNER] && scores[Intent.COMANDO_OWNER] > 0) {
    bestIntent = Intent.COMANDO_OWNER;
    bestScore = scores[Intent.COMANDO_OWNER];
  }

  return {
    intent: bestIntent,
    confidence: bestScore,
    entities: extractEntities(text, bestIntent),
  };
}

/**
 * Extrae entidades según intent
 */
function extractEntities(text: string, intent: Intent): Record<string, unknown> {
  const entities: Record<string, unknown> = {};

  if (intent === Intent.AGENDAR) {
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2})/);
    if (dateMatch) entities.fecha = dateMatch[0];

    const timeMatch = text.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) entities.hora = timeMatch[0];
  }

  if (intent === Intent.EMERGENCIA) {
    const keywords = text.toLowerCase().match(/urgente|emergencia|grave|encima/);
    entities.palabras_clave = keywords;
  }

  return entities;
}

const IntentSchema = z.enum([
  'agendar',
  'consultar_precio',
  'consultar_disponibilidad',
  'emergencia',
  'reclamo',
  'solicitar_humano',
  'comando_owner',
  'fuera_de_alcance',
  'confirmacion',
  'cancelacion',
  'reagendar',
  'reconocimiento',
]);

export { IntentSchema };