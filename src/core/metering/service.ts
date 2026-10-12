import { getSupabaseAdmin } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';

const log = logger.child({ module: 'metering' });

export type MetricType =
  | 'messages_in'
  | 'messages_out'
  | 'llm_calls'
  | 'llm_tokens'
  | 'appointments_booked';

/**
 * Incrementa un contador de métrica para un tenant.
 *
 * La función usa RPC si existe (increment_usage_metric), con fallback a upsert directo.
 * Nunca lanza excepciones - todos los errores se loggean silenciosamente para no
 * afectar el flujo principal de procesamiento de mensajes.
 */
export async function incrementMetric(
  tenantId: string,
  type: MetricType,
  value: number = 1
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // Intentar RPC primero (atómico, evita race conditions)
    const { error: rpcError } = await supabase.rpc('increment_usage_metric', {
      p_tenant_id: tenantId,
      p_date: today,
      p_column: type,
      p_value: value,
    });

    if (rpcError) {
      // Fallback: upsert directo (menos eficiente pero funcional)
      const { error: upsertError } = await supabase
        .from('usage_metrics')
        .upsert(
          {
            tenant_id: tenantId,
            metric_date: today,
            [type]: value
          },
          { onConflict: 'tenant_id,metric_date' }
        );

      if (upsertError) {
        log.error({ err: upsertError, tenantId, type }, 'Failed to record metric (upsert fallback)');
      }
    }
  } catch (err) {
    // El metering nunca debe romper el flujo principal
    log.error({ err, tenantId, type }, 'Metering service failed silently');
  }
}

/**
 * Obtiene métricas agregadas para un tenant en un rango de fechas.
 */
export async function getTenantMetrics(
  tenantId: string,
  fromDate: Date,
  toDate: Date = new Date()
): Promise<Record<string, number>> {
  const supabase = getSupabaseAdmin();
  const from = fromDate.toISOString().split('T')[0];
  const to = toDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('messages_in, messages_out, llm_calls, llm_tokens, appointments_booked')
    .eq('tenant_id', tenantId)
    .gte('metric_date', from)
    .lte('metric_date', to);

  if (error) {
    log.error({ err: error, tenantId }, 'Failed to fetch tenant metrics');
    return {
      messages_in: 0,
      messages_out: 0,
      llm_calls: 0,
      llm_tokens: 0,
      appointments_booked: 0,
    };
  }

  return (data ?? []).reduce(
    (acc, row) => {
      acc.messages_in += row.messages_in;
      acc.messages_out += row.messages_out;
      acc.llm_calls += row.llm_calls;
      acc.llm_tokens += row.llm_tokens;
      acc.appointments_booked += row.appointments_booked;
      return acc;
    },
    {
      messages_in: 0,
      messages_out: 0,
      llm_calls: 0,
      llm_tokens: 0,
      appointments_booked: 0,
    }
  );
}

/**
 * Obtiene resumen diario de todos los tenants (para dashboards de admin).
 */
export async function getAllTenantsDailySummary(date: Date = new Date()): Promise<Array<{
  tenantId: string;
  messages_in: number;
  messages_out: number;
  llm_calls: number;
  llm_tokens: number;
  appointments_booked: number;
}>> {
  const supabase = getSupabaseAdmin();
  const metricDate = date.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('tenant_id, messages_in, messages_out, llm_calls, llm_tokens, appointments_booked')
    .eq('metric_date', metricDate);

  if (error) {
    log.error({ err: error }, 'Failed to fetch daily summary');
    return [];
  }

  return (data ?? []).map(row => ({
    tenantId: row.tenant_id,
    messages_in: row.messages_in,
    messages_out: row.messages_out,
    llm_calls: row.llm_calls,
    llm_tokens: row.llm_tokens,
    appointments_booked: row.appointments_booked,
  }));
}