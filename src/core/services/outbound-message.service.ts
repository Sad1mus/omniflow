import { getSupabaseAdmin } from '../../lib/supabase';
import { getBullQueue } from '../../lib/redis';

export interface SendMessageInput {
  tenantId: string;
  contactId: string;
  phoneNumberId: string;
  type: 'text' | 'template';
  content: string;
  templateName?: string;
  templateVariables?: string[];
}

export interface SendResult {
  success: boolean;
  metaMessageId?: string;
  error?: string;
}

export class OutboundMessageService {
  private readonly supabase = getSupabaseAdmin();

  /**
   * Envía un mensaje de texto
   */
  async sendText(input: SendMessageInput): Promise<SendResult> {
    // TODO: implementar usando Cloud API provider
    throw new Error('Not implemented - requires Cloud API provider');
  }

  /**
   * Envía un mensaje usando plantilla
   */
  async sendTemplate(input: SendMessageInput): Promise<SendResult> {
    if (!input.templateName) {
      return { success: false, error: 'Template name required' };
    }
    // TODO: implementar usando Cloud API provider
    throw new Error('Not implemented - requires Cloud API provider');
  }

  /**
   * Guarda mensaje saliente en DB
   */
  async saveOutboundMessage(
    tenantId: string,
    contactId: string,
    type: string,
    content: string,
    metaMessageId: string,
    templateName?: string
  ) {
    await this.supabase.from('messages').insert({
      tenant_id: tenantId,
      contact_id: contactId,
      meta_message_id: metaMessageId,
      direction: 'outbound',
      type,
      content,
      template_name: templateName,
      status: 'sent',
    });
  }
}