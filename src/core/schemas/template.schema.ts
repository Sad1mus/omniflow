import { z } from 'zod';

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid().nullable(),
  vertical: z.enum(['clinic', 'real-estate', 'ecommerce', 'workshop', 'restaurant']).optional(),
  name: z.string().min(1),
  language: z.string().default('es'),
  category: z.enum(['UTILITY', 'MARKETING', 'AUTHENTICATION']).default('UTILITY'),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).default('draft'),
  meta_template_id: z.string().nullable(),
  content: z.object({
    header: z.string().optional(),
    body: z.string(),
    footer: z.string().optional(),
    buttons: z
      .array(
        z.object({
          type: z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
          text: z.string(),
          url: z.string().optional(),
          phone_number: z.string().optional(),
        })
      )
      .optional(),
  }),
  created_at: z.date(),
  updated_at: z.date(),
});

export const TemplateCreateSchema = TemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type Template = z.infer<typeof TemplateSchema>;
export type TemplateCreate = z.infer<typeof TemplateCreateSchema>;