import { z } from 'zod';

export const ContactSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  whatsapp_phone: z.string().regex(/^\d+$/),
  name: z.string().optional(),
  email: z.string().email().optional(),
  external_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  last_inbound_at: z.date().nullable(),
  last_outbound_at: z.date().nullable(),
  consent_status: z.enum(['unknown', 'granted', 'revoked', 'pending']).default('unknown'),
  consent_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ContactCreateSchema = ContactSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_inbound_at: true,
  last_outbound_at: true,
  consent_at: true,
});

export const ContactUpdateSchema = ContactCreateSchema.partial();

export type Contact = z.infer<typeof ContactSchema>;
export type ContactCreate = z.infer<typeof ContactCreateSchema>;
export type ContactUpdate = z.infer<typeof ContactUpdateSchema>;