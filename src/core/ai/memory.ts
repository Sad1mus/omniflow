import { z } from 'zod';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConversationMemory {
  contactId: string;
  tenantId: string;
  conversationId: string;
  messages: Message[];
  lastActive: Date;
  metadata: Record<string, unknown>;
}

/**
 * Conversación con ventana deslizante para ahorrar tokens
 */
export function createConversationMemory(
  contactId: string,
  tenantId: string,
  conversationId: string
): ConversationMemory {
  return {
    contactId,
    tenantId,
    conversationId,
    messages: [],
    lastActive: new Date(),
    metadata: {},
  };
}

/**
 * Añade mensaje y mantiene ventana de contexto
 */
export function addMessage(
  memory: ConversationMemory,
  message: Message,
  maxHistory = 20
): void {
  memory.messages.push(message);
  memory.lastActive = new Date();

  // Mantener ventana útil: no eliminar todo el historial, pero sí recortar el principio
  if (memory.messages.length > maxHistory) {
    const keepSystem = memory.messages.filter((m) => m.role === 'system');
    memory.messages = keepSystem.concat(memory.messages.slice(-maxHistory));
  }
}

/**
 * Recupera mensajes recientes para el LLM
 */
export function getContextMessages(
  memory: ConversationMemory,
  systemPrompt: string
): Message[] {
  const systemMessage = memory.messages.find((m) => m.role === 'system');
  const recent = memory.messages
    .filter((m) => m.role !== 'system')
    .slice(-10);

  if (!systemMessage) {
    return [
      { role: 'system', content: systemPrompt },
      ...recent,
    ];
  }

  return [systemMessage, ...recent];
}

const _ConversationMemorySchema = z.object({
  contactId: z.string().uuid(),
  tenantId: z.string().uuid(),
  conversationId: z.string().uuid(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  lastActive: z.date(),
  metadata: z.record(z.unknown()).default({}),
});

export type ConversationMemoryInput = z.infer<typeof _ConversationMemorySchema>;