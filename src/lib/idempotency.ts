import { getRedisClient } from './redis-client';

const IDEMPOTENCY_PREFIX = 'whatsapp:idempotency:';

/**
 * Genera la clave de idempotencia para un mensaje entrante
 */
export function makeIdempotencyKey(
  phoneNumberId: string,
  messageId: string
): string {
  return `${IDEMPOTENCY_PREFIX}${phoneNumberId}:${messageId}`;
}

/**
 * Verifica si un mensaje ya fue procesado (idempotencia)
 * @returns true si ya fue procesado, false si es nuevo
 */
export async function isProcessed(messageKey: string): Promise<boolean> {
  const redis = getRedisClient();
  const existed = await redis.exists(messageKey);
  return existed > 0;
}

/**
 * Marca un mensaje como procesado con TTL de 24 horas
 */
export async function markProcessed(messageKey: string): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(messageKey, 24 * 3600, '1');
}