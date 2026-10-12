import { z } from 'zod';

export const LabPersonaSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  persona: z.string(),
  greeting: z.string(),
  instructions: z.string(),
  farewell: z.string().optional(),
});

export const LabConversationSchema = z.object({
  id: z.string().uuid(),
  lab_run_id: z.string().uuid(),
  persona: z.string(),
  transcript: z.array(z.string()),
  started_at: z.date(),
  ended_at: z.date().nullable(),
  score: z.number().nullable(),
  passed: z.boolean().nullable(),
  feedback: z.string().nullable(),
});

export const LabRunSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  vertical: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  score: z.number().nullable(),
  metadata: z.record(z.unknown()).default({}),
  started_at: z.date(),
  ended_at: z.date().nullable(),
});

export const LabPersonaInputSchema = z.object({
  name: z.string().optional(),
  persona: z.string().optional(),
  greeting: z.string(),
  instructions: z.string(),
  farewell: z.string().optional(),
});

export const LabRunInputSchema = z.object({
  tenant_id: z.string().uuid(),
  vertical: z.string(),
  max_turns: z.number().default(12),
});

export type LabPersona = z.infer<typeof LabPersonaSchema>;
export type LabConversation = z.infer<typeof LabConversationSchema>;
export type LabRun = z.infer<typeof LabRunSchema>;
export type LabPersonaInput = z.infer<typeof LabPersonaInputSchema>;
export type LabRunInput = z.infer<typeof LabRunInputSchema>;