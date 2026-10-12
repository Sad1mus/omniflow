import { getSupabaseAdmin } from '../../lib/supabase.js';
import { getDailySummary, getWeeklyMetrics } from '../crm/metrics.service.js';
import { logger } from '../../lib/logger.js';

const log = logger.child({ module: 'owner-commands' });

export async function handleHoy(tenantId: string): Promise<string> {
  try {
    const summary = await getDailySummary(tenantId, new Date());
    return `📊 *Resumen de Hoy*\n` +
           `📅 Fecha: ${summary.date}\n` +
           `📩 Mensajes recibidos: ${summary.inboundMessages}\n` +
           `👤 Leads nuevos: ${summary.newLeads}\n` +
           `📅 Citas totales: ${summary.appointments.total}\n` +
           `   • Pendientes: ${summary.appointments.byStatus['pending'] || 0}\n` +
           `   • Completadas: ${summary.appointments.byStatus['completed'] || 0}\n` +
           `   • Canceladas: ${summary.appointments.byStatus['cancelled'] || 0}`;
  } catch (err) {
    log.error({ err, tenantId }, 'Error en comando /hoy');
    return 'Lo siento, no pude obtener el resumen del día en este momento.';
  }
}

export async function handleSemana(tenantId: string): Promise<string> {
  try {
    const metrics = await getWeeklyMetrics(tenantId);
    return `📈 *Reporte Semanal*\n` +
           `📅 Período: Últimos 7 días\n` +
           `👥 Total de leads: ${metrics.totalLeads}\n` +
           `✅ Leads convertidos: ${metrics.convertedLeads}\n` +
           `🎯 Tasa de conversión: ${metrics.conversionRate}`;
  } catch (err) {
    log.error({ err, tenantId }, 'Error en comando /semana');
    return 'Lo siento, no pude generar el reporte semanal.';
  }
}

export async function handleEditar(tenantId: string, newText: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  try {
    const { data: tenant, error: fetchErr } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    if (fetchErr) throw fetchErr;

    const currentSettings = (tenant?.settings as Record<string, any>) || {};
    const updateLog = currentSettings.owner_edits || [];
    updateLog.push({ date: new Date().toISOString(), change: newText });

    const { error: updateErr } = await supabase
      .from('tenants')
      .update({ settings: { ...currentSettings, owner_edits: updateLog } })
      .eq('id', tenantId);

    if (updateErr) throw updateErr;

    return `✅ *Información actualizada*\nHe registrado el siguiente cambio: "${newText}".\nMi conocimiento se actualizará en la próxima interacción.`;
  } catch (err) {
    log.error({ err, tenantId }, 'Error en comando /editar');
    return 'Lo siento, no pude procesar la actualización en este momento.';
  }
}

export async function handleMetrics(tenantId: string): Promise<string> {
  return await handleSemana(tenantId);
}