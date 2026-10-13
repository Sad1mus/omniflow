import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import { logger } from '../logger.js';

const log = logger.child({ module: 'observability-metrics' });

export const register = new Registry();

// Métricas por defecto (CPU, memoria, etc.)
collectDefaultMetrics({ register });

// Métricas custom
export const messagesProcessed = new Counter({
  name: 'omniflow_messages_processed_total',
  help: 'Total de mensajes procesados',
  labelNames: ['tenant_id', 'direction', 'status'],
  registers: [register],
});

export const llmLatency = new Histogram({
  name: 'omniflow_llm_latency_seconds',
  help: 'Latencia de llamadas al LLM',
  labelNames: ['tenant_id', 'model', 'success'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const appointmentsBooked = new Counter({
  name: 'omniflow_appointments_booked_total',
  help: 'Total de citas agendadas',
  labelNames: ['tenant_id', 'vertical'],
  registers: [register],
});

export function recordMessageProcessed(
  tenantId: string,
  direction: 'inbound' | 'outbound',
  status: 'success' | 'error'
): void {
  messagesProcessed.inc({ tenant_id: tenantId, direction, status });
}

export function recordLLMLatency(
  tenantId: string,
  model: string,
  latencyMs: number,
  success: boolean
): void {
  llmLatency.observe(
    { tenant_id: tenantId, model, success: String(success) },
    latencyMs / 1000
  );
}

export function recordAppointmentBooked(tenantId: string, vertical: string): void {
  appointmentsBooked.inc({ tenant_id: tenantId, vertical });
}

log.info('Prometheus metrics initialized');