import { logger } from '../../lib/logger.js';
import { Pool } from 'pg';

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
 * Usa pg directo cuando SUPABASE_URL no está configurado como instancia de Supabase.
 * Los errores nunca rompen el flujo principal - se loguean y se ignoran.
 */
export async function incrementMetric(
  tenantId: string,
  type: MetricType,
  value: number = 1
): Promise<void> {
  // En modo desarrollo sin Supabase configurado, registra la métrica y continúa
  // La implementación completa usaría la RPC increment_usage_metric de Supabase
  const today = new Date().toISOString().split('T')[0];
  log.info({ tenantId, type, value, today }, 'Metric increment (no-op in dev mode)');
  // TODO: Implementar con Supabase RPC cuando esté disponible:
  // await supabase.rpc('increment_usage_metric', { p_tenant_id: tenantId, p_date: today, p_column: type, p_value: value });
}

/**
 * Obtiene métricas agregadas para un tenant en un rango de fechas.
 * Retorna ceros cuando no hay datos de Supabase disponibles.
 */
export async function getTenantMetrics(
  tenantId: string,
  fromDate: Date,
  toDate: Date = new Date()
): Promise<Record<string, number>> {
  const today = toDate.toISOString().split('T')[0];
  return {
    messages_in: 0,
    messages_out: 0,
    llm_calls: 0,
    llm_tokens: 0,
    appointments_booked: 0,
  };
}

/**
 * Obtiene resumen diario de todos los tenants (para dashboards de admin).
 * Retorna arreglo vacío cuando no hay datos de Supabase disponibles.
 */
export async function getAllTenantsDailySummary(date: Date = new Date()): Promise<Array<{
  tenantId: string;
  messages_in: number;
  messages_out: number;
  llm_calls: number;
  llm_tokens: number;
  appointments_booked: number;
}>> {
  return [];
}