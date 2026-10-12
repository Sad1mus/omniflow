import { z } from 'zod';
import { EnvSchema } from '../core/schemas/env.schema';

/**
 * Valida y carga las variables de entorno
 */
export const env = EnvSchema.parse(process.env);

export type Env = z.infer<typeof EnvSchema>;