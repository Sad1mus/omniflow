import { getRedisClient } from '../../lib/redis';
import { WhatsAppRateLimiter } from './rate-limiter';

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000,
  shouldRetry?: (error: Error) => boolean
): Promise<T> {
  const rateLimiter = new WhatsAppRateLimiter();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Verificar rate limit antes de cada intento
      // TODO: obtener waba_id del contexto
      await rateLimiter.checkLimit('waba-unknown');

      return await fn();
    } catch (error) {
      const isTransient = shouldRetry?.(error as Error) ?? true;

      if (!isTransient || attempt === maxAttempts) {
        throw error;
      }

      // Backoff exponencial
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Retry ${attempt}/${maxAttempts} after ${delayMs}ms`, error);

      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // Retornar el último error (shouldn't reach here)
  throw new Error('Max attempts exceeded');
}