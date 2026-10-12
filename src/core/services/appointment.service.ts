import { getSupabaseAdmin } from '../../lib/supabase';
import { z } from 'zod';

export class AppointmentService {
  private readonly supabase = getSupabaseAdmin();

  /**
   * Verifica disponibilidad para un horario
   */
  async checkAvailability(
    tenantId: string,
    startsAt: Date,
    durationMinutes: number = 30
  ): Promise<boolean> {
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60000);

    const { data, error } = await this.supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenantId)
      .not('status', 'in', ['cancelled', 'no_show'])
      .lt('starts_at', endsAt.toISOString())
      .gt('ends_at', startsAt.toISOString());

    if (error) throw error;
    return data.length === 0;
  }

  /**
   * Crea una cita
   */
  async create(tenantId: string, input: any) {
    const result = await this.supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        contact_id: input.contactId,
        lead_id: input.leadId,
        service: input.service,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        status: 'pending',
      })
      .select()
      .single();

    return result.data;
  }

  /**
   * Cancela una cita
   */
  async cancel(tenantId: string, appointmentId: string) {
    const { error } = await this.supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('tenant_id', tenantId)
      .eq('id', appointmentId);

    if (error) throw error;
  }

  /**
   * Reagenda una cita
   */
  async reschedule(
    tenantId: string,
    appointmentId: string,
    newStartsAt: Date,
    newEndsAt: Date
  ) {
    const { error } = await this.supabase
      .from('appointments')
      .update({
        starts_at: newStartsAt.toISOString(),
        ends_at: newEndsAt.toISOString(),
        status: 'pending',
      })
      .eq('tenant_id', tenantId)
      .eq('id', appointmentId);

    if (error) throw error;
  }
}