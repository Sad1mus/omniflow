import pino from 'pino';
import pinoHttp from 'pino-http';

import { env } from '../config/env';

const redactedFields = [
  'access_token',
  'token',
  'api_key',
  'secret',
  'password',
  'encryption_key',
  'service_role_key',
  'app_secret',
  'verify_token',
  'openrouter_api_key',
  'meta_app_secret',
  'email',
];

/**
 * Crea el logger centralizado de la aplicación
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
  redact: {
    paths: redactedFields.map((field) => `response.${field}`),
    remove: true,
  },
});

/**
 * Middleware HTTP con logger estructurado
 */
export const httpLogger = pinoHttp({
  customSuccessMessage: (req) => `HTTP ${req.method} ${req.url} ${req.statusCode}`,
  customErrorMessage: (_req, res) => `HTTP error ${res.statusCode}`,
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
  },
  customProps: (req) => ({
    tenantId: (req as any).tenantId || 'unknown',
  }),
});

/**
 * Redacta secretos de un objeto para logueo seguro
 */
export function redactLog(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactLog(item));
  }

  const record = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    const redactedKey = redactedFields.find((field) =>
      key.toLowerCase().includes(field.toLowerCase())
    );

    if (redactedKey) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactLog(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}