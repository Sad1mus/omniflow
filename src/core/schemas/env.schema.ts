import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  OWNER_TOKEN: z.string().optional(),

  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),

  WHATSAPP_PROVIDER: z
    .enum(['cloud', 'baileys'])
    .default('cloud'),
  ENABLE_REAL_MESSAGES: z.coerce.boolean().default(false),

  META_APP_SECRET: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  META_WABA_ID: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),

  OPENROUTER_API_KEY: z.string().optional(),
  DEFAULT_MODEL: z.string().default('anthropic/claude-3.5-sonnet'),
  FALLBACK_MODEL: z.string().default('meta-llama/llama-3.1-70b-instruct'),
  AI_MAX_TOKENS: z.coerce.number().min(1).default(2048),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),

  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  QUEUE_CONCURRENCY: z.coerce.number().min(1).default(5),

  LAB_MODE: z.coerce.boolean().default(true),
  LAB_MAX_TURNS: z.coerce.number().min(1).default(12),

  GUARDRAILS_STRICT: z.coerce.boolean().default(true),
  HUMAN_ESCALATION_REQUIRED: z.coerce.boolean().default(false),

  ENCRYPTION_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(): Env {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    console.error('Error parsing environment variables:', error);
    process.exit(1);
  }
}