import { getSupabaseAdmin } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';
import { makeIdempotencyKey, isProcessed, markProcessed } from '../../lib/idempotency.js';
import { resolveTenantByPhoneNumberId } from '../tenants/service.js';

const log = logger.child({ module: 'inbound-message' });

export interface InboundJobData {
  phoneNumberId: string;
  wabaId?: string;
  messageId: string;
  contactPhone: string;
  contactName?: string;
  message: {
    type: string;
    text?: string;
    image?: { caption?: string };
    audio?: unknown;
    video?: unknown;
    document?: unknown;
  };
  timestamp: string;
}

export interface ProcessedInbound {
  tenantId: string;
  conversationId: string;
  contactId: string;
  messageId: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class InboundMessageService {
  /**
   * Procesa un mensaje entrante: idempotencia, resolución de tenant,
   * upsert de contacto/conversación, guardado de mensaje, carga de historial.
   */
  async process(data: InboundJobData): Promise<ProcessedInbound> {
    // 1. Idempotencia
    const idempotencyKey = makeIdempotencyKey('whatsapp:inbound', data.messageId);
    if (await isProcessed(idempotencyKey)) {
      log.info({ messageId: data.messageId }, 'duplicate message, skipping');
      throw new Error('DUPLICATE');
    }

    // 2. Resolver tenant REAL por phone_number_id (NO usar phoneNumberId como tenant_id)
    const tenant = await resolveTenantByPhoneNumberId(data.phoneNumberId);
    if (!tenant) {
      log.error({ phoneNumberId: data.phoneNumberId }, 'tenant not found for phone_number_id');
      throw new Error('TENANT_NOT_FOUND');
    }
    const tenantId = tenant.id;

    const supabase = getSupabaseAdmin();

    // 3. Upsert contacto
    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .upsert(
        {
          tenant_id: tenantId,
          whatsapp_phone: data.contactPhone,
          name: data.contactName ?? null,
          last_inbound_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,whatsapp_phone' }
      )
      .select('id')
      .single();

    if (contactErr || !contact) {
      log.error({ err: contactErr }, 'failed to upsert contact');
      throw contactErr ?? new Error('CONTACT_UPSERT_FAILED');
    }
    const contactId = contact.id;

    // 4. Upsert conversación
    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .upsert(
        {
          tenant_id: tenantId,
          contact_id: contactId,
          status: 'open',
          channel: 'whatsapp',
          ai_enabled: true,
        },
        { onConflict: 'tenant_id,contact_id' }
      )
      .select('id')
      .single();

    if (convErr || !conversation) {
      log.error({ err: convErr }, 'failed to upsert conversation');
      throw convErr ?? new Error('CONVERSATION_UPSERT_FAILED');
    }
    const conversationId = conversation.id;

    // 5. Guardar mensaje entrante
    const textContent =
      data.message.text ??
      data.message.image?.caption ??
      `[${data.message.type} message]`;

    await supabase.from('messages').insert({
      tenant_id: tenantId,
      conversation_id: conversationId,
      contact_id: contactId,
      meta_message_id: data.messageId,
      direction: 'inbound',
      type: data.message.type,
      content: textContent,
      status: 'received',
    });

    // 6. Cargar historial reciente
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('direction, content')
      .eq('tenant_id', tenantId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);

    const history = (recentMessages ?? [])
      .reverse()
      .map((m) => ({
        role: m.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
        content: m.content ?? '',
      }))
      .filter((m) => m.content.length > 0);

    // 7. Marcar idempotencia (TTL 24h, hardcoded en markProcessed)
    await markProcessed(idempotencyKey);

    log.info({ tenantId, contactId, conversationId, messageId: data.messageId }, 'inbound processed');

    return {
      tenantId,
      conversationId,
      contactId,
      messageId: data.messageId,
      history,
    };
  }
}

export const inboundMessageService = new InboundMessageService();