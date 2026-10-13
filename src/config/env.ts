import { z } from 'zod';
import { EnvSchema } from '../core/schemas/env.schema';

// CRÍTICO: dotenv debe cargarse ANTES de importar logger/tracing (evita circular)
// Env.ts es importado por lib/logger.ts, que a su vez es importado por lib/observability/tracing.ts,
// que es importado por server.ts ANTES de importar dotenv/config. Si no cargamos aquí,
// process.env.DATABASE_URL está undefined cuando se ejecuta EnvSchema.parse.
import 'dotenv/config';

/**
 * Valida y carga las variables de entorno
 */
export const env = EnvSchema.parse(process.env);

export type Env = z.infer<typeof EnvSchema>;