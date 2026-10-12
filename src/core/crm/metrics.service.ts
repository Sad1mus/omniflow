import { getSupabaseAdmin } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';

const log = logger.child({ module: 'crm-metrics' });

export async function getDailySummary(tenantId: string, date: Date) {
  const supabase = getSupabaseAdmin();
  const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

  // Citas del día
  const { data: appointments, error: appErr } = await supabase
    .from('appointments')
    .select('status, service')
    .eq('tenant_id', tenantId)
    .gte('starts_at', startOfDay)
    .lte('starts_at', endOfDay);

  // Mensajes del día (inbound)
  const { count: msgCount, error: msgErr } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('direction', 'inbound')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  // Leads nuevos del día
  const { count: leadCount, error: leadErr } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'new')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (appErr || msgErr || leadErr) {
    log.error({ appErr, msgErr, leadErr }, 'Error fetching daily summary');
    throw new Error('Failed to fetch daily summary');
  }

  const apptByStatus = appointments?.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    date: startOfDay.split('T')[0],
    appointments: {
      total: appointments?.length || 0,
      byStatus: apptByStatus,
    },
    inboundMessages: msgCount || 0,
    newLeads: leadCount || 0,
  };
}

export async function getWeeklyMetrics(tenantId: string) {
  const supabase = getSupabaseAdmin();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: leads, error } = await supabase
    .from('leads')
    .select('status, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', sevenDaysAgo.toISOString());

  if (error) throw new Error('Failed to fetch weekly metrics');

  const total = leads?.length || 0;
  const converted = leads?.filter(l => l.status === 'won' || l.status === 'client').length || 0;
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';

  return {
    period: 'last_7_days',
    totalLeads: total,
    convertedLeads: converted,
    conversionRate: `${conversionRate}%`,
  };
}