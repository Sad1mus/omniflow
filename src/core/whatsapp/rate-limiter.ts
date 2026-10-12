import { getRedisClient } from '../../lib/redis';

export class WhatsAppRateLimiter {
  private readonly redis = getRedisClient();

  /**
   * Verifica si se puede enviar un mensaje
   * Meta permite ~80 mensajes por segundo por WABA
   */
  async checkLimit(wabaId: string): Promise<boolean> {
    const key = `ratelimit:waba:${wabaId}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, 1); // 1 segundo
    }

    // Meta permite ~80/s, dejamos margen
    return current <= 70;
  }

  /**
   * Espera hasta que haya cupo
   */
  async waitForSlot(wabaId: string, maxWaitMs = 5000): Promise<void> {
    const start = Date.now();

    while (!(await this.checkLimit(wabaId))) {
      if (Date.now() - start > maxWaitMs) {
        throw new Error('Rate limit exceeded - max wait time reached');
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }
}