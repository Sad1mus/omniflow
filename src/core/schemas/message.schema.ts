import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  conversation_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),
  meta_message_id: z.string().nullable(),
  direction: z.enum(['inbound', 'outbound']),
  type: z.enum(['text', 'image', 'audio', 'video', 'document', 'interactive', 'sticker', 'location', 'contacts', 'reaction', 'template']).default('text'),
  content: z.string().nullable(),
  media_url: z.string().nullable(),
  template_name: z.string().nullable(),
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).default('pending'),
  error: z.record(z.unknown()).nullable(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.date(),
});

export const MessageCreateSchema = MessageSchema.omit({
  id: true,
  created_at: true,
});

export type Message = z.infer<typeof MessageSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;