import { Queue, Worker, type Job } from 'bullmq';
import type { RedisOptions } from 'ioredis';

import { getRedisClient } from './redis-client';
export { getRedisClient } from './redis-client';

let bullQueue: Queue | null = null;

/**
 * Cliente BullMQ para colas de mensajes
 */
export function getBullQueue(): Queue {
  if (!bullQueue) {
    bullQueue = new Queue('whatsapp-messages', {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600, // 24h
        },
        removeOnFail: {
          count: 500,
          age: 7 * 24 * 3600, // 7d
        },
      },
    });
  }
  return bullQueue;
}

/**
 * Worker para procesar jobs de BullMQ
 */
export function createBullWorker(
  processor: (job: Job) => Promise<void>,
  concurrency = Number(process.env.QUEUE_CONCURRENCY || '5')
) {
  const queue = getBullQueue();
  const worker = new Worker(
    queue.name,
    async (job) => {
      try {
        await processor(job);
      } catch (err) {
        console.error('Worker processor error:', err);
        throw err;
      }
    },
    {
      connection: getRedisClient(),
      concurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}

/**
 * Cierra conexiones gracefully
 */
export async function shutdownRedis() {
  if (bullQueue) {
    await bullQueue.close();
    bullQueue = null;
  }
}