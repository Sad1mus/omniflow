import { getSupabaseAdmin } from '../../lib/supabase';

export class ConversationService {
  private readonly supabase = getSupabaseAdmin();

  /**
   * Obtiene o crea una conversación para un contacto
   */
  async getOrCreate(tenantId: string, contactId: string) {
    const existing = await this.supabase
      .from('conversations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('contact_id', contactId)
      .eq('status', 'open')
      .single();

    if (!existing.error) {
      return existing.data;
    }

    const created = await this.supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        contact_id: contactId,
        status: 'open',
      })
      .select()
      .single();

    return created.data;
  }

  /**
   * Obtiene historial de conversación
   */
  async getHistory(conversationId: string, limit = 100) {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  /**
   * Cierra conversación
   */
  async close(conversationId: string) {
    const { error } = await this.supabase
      .from('conversations')
      .update({ status: 'closed' })
      .eq('id', conversationId);

    if (error) throw error;
  }
}