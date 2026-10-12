import { VerticalDefinition } from '../types.js';

export const realEstateVertical: VerticalDefinition = {
  id: 'real-estate',
  name: 'Inmobiliaria',
  description: 'Búsqueda de propiedades y agendamiento de visitas',
  systemPrompt: 'Eres un asesor inmobiliario. Nunca inventes precios ni disponibilidad.',
  tools: [
    {
      name: 'search_properties',
      description: 'Busca propiedades disponibles según los criterios especificados por el cliente',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'Ubicación o barrio de la propiedad' },
          minPrice: { type: 'number', description: 'Precio mínimo (opcional)' },
          maxPrice: { type: 'number', description: 'Precio máximo (opcional)' },
          bedrooms: { type: 'number', description: 'Número de dormitorios (opcional)' },
        },
        required: ['location'],
        additionalProperties: false,
      } as const,
      execute: async (_args: Record<string, unknown>, _ctx: unknown) => ({
        success: true,
        properties: [
          { id: 'prop-001', address: 'Av. Reforma 123, Col. Centro', price: 180000000, bedrooms: 2 },
          { id: 'prop-002', address: 'Calle Hidalgo 456, Col. Condesa', price: 250000000, bedrooms: 3 },
        ],
      }),
    },
    {
      name: 'schedule_viewing',
      description: 'Agenda una visita a propiedad para un cliente específico',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID de la propiedad a visitar' },
          visitorPhone: { type: 'string', description: 'Teléfono del visitante' },
          preferredDate: { type: 'string', description: 'Fecha preferida en formato YYYY-MM-DD' },
        },
        required: ['propertyId', 'visitorPhone'],
        additionalProperties: false,
      } as const,
      execute: async (_args: Record<string, unknown>, _ctx: unknown) => ({
        success: true,
        scheduled: true,
        message: 'Visita agendada exitosamente. Recibirás confirmación por mensaje.',
      }),
    },
  ],
  templates: [{ name: 'viewing_confirmation', category: 'UTILITY', language: 'es' }],
  ownerCommands: []
};