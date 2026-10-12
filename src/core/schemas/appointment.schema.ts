import { z } from 'zod';

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  lead_id: z.string().uuid().nullable(),
  service: z.string(),
  starts_at: z.date(),
  ends_at: z.date().nullable(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled']).default('pending'),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.date(),
  updated_at: z.date(),
});

export const AppointmentCreateSchema = AppointmentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const AppointmentUpdateSchema = AppointmentCreateSchema.partial();

export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentCreate = z.infer<typeof AppointmentCreateSchema>;
export type AppointmentUpdate = z.infer<typeof AppointmentUpdateSchema>;