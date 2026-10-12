import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Cliente Redis singleton
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL es requerido');
    }
    redisClient = new Redis(url, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: null,
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }
  return redisClient;
}

/**
 * Cierra conexión gracefully
 */
export async function shutdownRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}