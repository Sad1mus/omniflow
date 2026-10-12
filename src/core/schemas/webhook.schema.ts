import { z } from 'zod';

// Meta webhook verification GET
export const MetaVerifySchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string(),
});

// Meta webhook message entry
export const MetaContactSchema = z.object({
  profile: z.object({ name: z.string().optional() }).optional(),
  wa_id: z.string(),
});

export const MetaMessageTextSchema = z.object({
  body: z.string(),
});

export const MetaMessageImageSchema = z.object({
  caption: z.string().optional(),
  mime_type: z.string(),
  sha256: z.string(),
  id: z.string(),
});

export const MetaMessageAudioSchema = z.object({
  mime_type: z.string(),
  sha256: z.string(),
  id: z.string(),
  voice: z.boolean().optional(),
});

export const MetaMessageInteractiveSchema = z.object({
  type: z.enum(['button_reply', 'list_reply']),
  button_reply: z
    .object({
      id: z.string(),
      title: z.string(),
    })
    .optional(),
  list_reply: z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
    })
    .optional(),
});

export const MetaMessageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
  type: z.enum(['text', 'image', 'audio', 'video', 'document', 'interactive', 'sticker', 'location', 'contacts', 'reaction']),
  text: MetaMessageTextSchema.optional(),
  image: MetaMessageImageSchema.optional(),
  audio: MetaMessageAudioSchema.optional(),
  interactive: MetaMessageInteractiveSchema.optional(),
});

export const MetaMetadataSchema = z.object({
  display_phone_number: z.string(),
  phone_number_id: z.string(),
});

export const MetaChangeValueSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  metadata: MetaMetadataSchema,
  contacts: z.array(MetaContactSchema).optional(),
  messages: z.array(MetaMessageSchema).optional(),
  statuses: z
    .array(
      z.object({
        id: z.string(),
        status: z.enum(['sent', 'delivered', 'read', 'failed']),
        timestamp: z.string(),
        recipient_id: z.string(),
        conversation: z
          .object({
            id: z.string(),
            expiration_timestamp: z.string(),
            origin: z.enum(['utility', 'marketing', 'authentication', 'referral_conversion']),
          })
          .optional(),
        pricing: z
          .object({
            billable: z.boolean(),
            pricing_model: z.enum(['CBP', 'NBP']),
            category: z.enum(['utility', 'marketing', 'authentication']),
          })
          .optional(),
      })
    )
    .optional(),
});

export const MetaChangeSchema = z.object({
  value: MetaChangeValueSchema,
  field: z.literal('messages'),
});

export const MetaEntrySchema = z.object({
  id: z.string(),
  changes: z.array(MetaChangeSchema),
});

export const MetaWebhookPayloadSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(MetaEntrySchema),
});

// Tipos inferidos
export type MetaVerify = z.infer<typeof MetaVerifySchema>;
export type MetaWebhookPayload = z.infer<typeof MetaWebhookPayloadSchema>;
export type MetaMessage = z.infer<typeof MetaMessageSchema>;
export type MetaContact = z.infer<typeof MetaContactSchema>;
export type MetaChangeValue = z.infer<typeof MetaChangeValueSchema>;