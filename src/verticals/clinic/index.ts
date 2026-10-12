import { VerticalDefinition } from '../types.js';

export const clinicVertical: VerticalDefinition = {
  id: 'clinic',
  name: 'Clínica',
  description: 'Agendamiento médico y triaje básico',
  systemPrompt: 'Eres un asistente de clínica. Nunca diagnoses. Si hay emergencia, escala a humano.',
  tools: [
    {
      name: 'check_availability',
      description: 'Consulta la disponibilidad de citas para una fecha y servicio dados',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
          service: { type: 'string', description: 'Tipo de consulta (opcional)' },
        },
        required: ['date'],
        additionalProperties: false,
      } as const,
      execute: async (_args: Record<string, unknown>, _ctx: unknown) => ({
        success: true,
        availableSlots: ['09:00', '11:00', '14:00', '16:00'],
      }),
    },
    {
      name: 'escalate_to_human',
      description: 'Escala la conversación a un agente humano cuando la request está fuera del alcance del asistente',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Motivo de la escalación' },
        },
        required: ['reason'],
        additionalProperties: false,
      } as const,
      execute: async (_args: Record<string, unknown>, _ctx: unknown) => ({
        success: true,
        escalated: true,
        message: 'Transferido a un agente humano para atender tu solicitud.',
      }),
    },
  ],
  templates: [{ name: 'appointment_reminder', category: 'UTILITY', language: 'es' }],
  ownerCommands: []
};