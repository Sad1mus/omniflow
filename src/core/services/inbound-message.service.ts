import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabase';
import { getBullQueue } from '../../lib/redis';
import { getRedisClient } from '../../lib/redis';
import { MetaWebhookPayloadSchema, MetaMessageSchema } from '../schemas/webhook.schema';

export class InboundMessageService {
  private readonly supabase = getSupabaseAdmin();
  private readonly bullQueue = getBullQueue();

  /**
   * Procesa un payload de webhook entrante
   */
  async process(payload: z.infer<typeof MetaWebhookPayloadSchema>): Promise<void> {
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          for (const message of change.value.messages) {
            await this.handleMessage(message, entry, change.value.metadata.phone_number_id);
          }
        } else if (change.value.statuses) {
          for (const status of change.value.statuses) {
            await this.handleStatus(status);
          }
        }
      }
    }
  }

  private async handleMessage(
    message: z.infer<typeof MetaMessageSchema>,
    entry: any,
    phoneNumberId: string
  ): Promise<void> {
    // 1. Idempotencia: verificar si ya procesamos este mensaje
    const key = `whatsapp:message:${phoneNumberId}:${message.id}`;
    const alreadyProcessed = await getRedisClient().get(key);
    if (alreadyProcessed) {
      console.info(`Mensaje duplicado ignorado: ${message.id}`);
      return;
    }

    // 2. Guardar contacto
    const contactData = {
      whatsapp_phone: message.from.replace('+', ''),
      name: (entry.contacts?.[0] as any)?.profile?.name,
    };
    const contact = await this.saveContact(contactData, phoneNumberId);

    // 3. Guardar conversación y mensaje
    await this.saveMessage(message, contact.id, phoneNumberId);

    // 4. Marcar como procesado
    await getRedisClient().setex(key, 24 * 3600, '1');

    // 5. Encolar procesamiento
    await this.bullQueue.add('whatsapp.message.received', {
      contactId: contact.id,
      phoneNumberId,
      messageId: message.id,
      message: message,
    });
  }

  private async saveContact(data: any, phoneNumberId: string) {
    const result = await this.supabase
      .from('contacts')
      .upsert(
        {
          tenant_id: phoneNumberId, // TODO: resolver tenant real
          whatsapp_phone: data.whatsapp_phone,
          name: data.name,
        },
        {
          onConflict: 'tenant_id,whatsapp_phone',
        }
      )
      .select()
      .single();

    return result.data;
  }

  private async saveMessage(message: any, contactId: string, phoneNumberId: string) {
    const result = await this.supabase
      .from('messages')
      .insert({
        tenant_id: phoneNumberId,
        contact_id: contactId,
        meta_message_id: message.id,
        direction: 'inbound',
        type: message.type,
        content: message.text?.body || message.caption,
      })
      .select()
      .single();

    return result.data;
  }

  private async handleStatus(status: any) {
    await this.supabase
      .from('messages')
      .update({
        status: status.status,
      })
      .eq('meta_message_id', status.id);
  }
}