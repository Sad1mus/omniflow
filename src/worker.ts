// CRÍTICO: OpenTelemetry debe inicializarse antes de cualquier otro import
import 'dotenv/config';
import { initializeTracing } from './lib/observability/tracing.js';
initializeTracing();

import { createBullWorker } from './lib/redis.js';
import { logger } from './lib/logger.js';
import { env } from './config/env.js';
import { inboundMessageService, type InboundJobData } from './core/services/inbound-message.service.js';
import { outboundMessageService } from './core/services/outbound-message.service.js';
import { runAgentRuntime } from './core/ai/runtime.js';
import { applyGuardrails, type GuardrailsContext } from './core/ai/guardrails.js';
import { resolveTenantByPhoneNumberId } from './core/tenants/service.js';

const log = logger.child({ module: 'worker' });

async function handleJob(job: { id?: string; data: InboundJobData }) {
  const jobId = job.id ?? 'unknown';
  const data = job.data;

  log.info({ jobId, phoneNumberId: data.phoneNumberId, messageId: data.messageId }, 'processing job');

  try {
    // 1. Resolver tenant REAL
    const tenant = await resolveTenantByPhoneNumberId(data.phoneNumberId);
    if (!tenant) {
      log.error({ phoneNumberId: data.phoneNumberId }, 'tenant not found');
      return;
    }

    // 2. Procesar mensaje entrante
    const inbound = await inboundMessageService.process(data);

    // 3. Detectar comando del dueño
    if (data.message.text && data.message.text.startsWith('/')) {
      log.info({ jobId }, 'owner command detected, skipping AI');
      // TODO: dispatch to owner command handler
      return;
    }

    // 4. Ejecutar AI runtime
    const aiResponse = await runAgentRuntime({
      tenantId: tenant.id,
      vertical: tenant.vertical,
      conversationId: inbound.conversationId,
      contactId: inbound.contactId,
      messageId: data.messageId,
      messageText: data.message.text ?? '',
      history: inbound.history,
    });

    // 5. Aplicar guardrails
    const guardrailsCtx: GuardrailsContext = {
      tenantId: tenant.id,
      vertical: tenant.vertical,
      input: data.message.text ?? '',
      output: aiResponse.text,
      toolCalls: aiResponse.toolCalls,
      contactId: inbound.contactId,
    };

    const guardResult = applyGuardrails(guardrailsCtx);

    if (guardResult.blocked) {
      log.warn({ jobId, reason: guardResult.reason }, 'guardrails blocked response');
      await outboundMessageService.sendText({
        tenantId: tenant.id,
        conversationId: inbound.conversationId,
        contactId: inbound.contactId,
        text: guardResult.fallbackText ?? 'Lo siento, necesito transferirte con un miembro de nuestro equipo.',
      });
      return;
    }

    // 6. Enviar respuesta
    await outboundMessageService.sendText({
      tenantId: tenant.id,
      conversationId: inbound.conversationId,
      contactId: inbound.contactId,
      text: guardResult.sanitizedOutput ?? aiResponse.text,
    });

    log.info({ jobId }, 'job completed');
  } catch (err) {
    log.error({ jobId, err }, 'job failed');
    throw err; // BullMQ reintentará
  }
}

async function main() {
  log.info({ concurrency: env.QUEUE_CONCURRENCY }, 'starting worker');

  const worker = createBullWorker(async (job: { id?: string; data: InboundJobData }) => {
    await handleJob(job);
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'job failed permanently');
  });

  worker.on('completed', (job) => {
    log.debug({ jobId: job.id }, 'job completed');
  });

  const shutdown = async () => {
    log.info('shutting down worker');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  log.fatal({ err }, 'worker crashed');
  process.exit(1);
});