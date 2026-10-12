import { z } from 'zod';

export const TenantBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  vertical: z.enum(['clinic', 'real-estate', 'ecommerce', 'workshop', 'restaurant']),
  status: z.enum(['active', 'paused', 'suspended']),
  timezone: z.string().default('America/Mexico_City'),
  settings: z.record(z.unknown()).default({}),
});

export const TenantCreateSchema = TenantBaseSchema.extend({
  id: z.string().uuid().optional(),
});

export const TenantUpdateSchema = TenantBaseSchema.partial();

export const TenantCredentialsSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  provider: z.literal('meta_cloud'),
  meta_waba_id: z.string().optional(),
  meta_phone_number_id: z.string().optional(),
  encrypted_access_token: z.string(),
  verify_token: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending_verification']).default('active'),
});

// Tipos
export type Tenant = z.infer<typeof TenantBaseSchema>;
export type TenantCreate = z.infer<typeof TenantCreateSchema>;
export type TenantUpdate = z.infer<typeof TenantUpdateSchema>;
export type TenantCredentials = z.infer<typeof TenantCredentialsSchema>;