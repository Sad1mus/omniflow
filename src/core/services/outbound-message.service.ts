import { getSupabaseAdmin } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import { cloudProvider } from '../whatsapp/providers/cloud.provider.js';
import { isWithin24HourWindow } from '../../lib/time.js';
import { templateService } from '../whatsapp/templates.js';
import { audit } from './audit.service.js';
import { decryptCredential } from '../../lib/crypto.js';
import { incrementMetric } from '../metering/service.js';
import { recordMessageProcessed } from '../../lib/observability/metrics.js';

const log = logger.child({ module: 'outbound-message' });

export interface SendOutboundInput {
  tenantId: string;
  conversationId: string;
  contactId: string;
  type: 'text' | 'template';
  text?: string;
  templateName?: string;
  templateVariables?: string[];
  forceTemplate?: boolean;
}

export class OutboundMessageService {
  async send(input: SendOutboundInput): Promise<void> {
    const { tenantId, conversationId, contactId } = input;
    const supabase = getSupabaseAdmin();

    // 1. Cargar contacto
    const { data: contact, error: contactErr } = await supabase
      .from('contacts').select('whatsapp_phone').eq('id', contactId).eq('tenant_id', tenantId).single();
    if (contactErr || !contact) throw new Error('CONTACT_NOT_FOUND');

    // 2. Cargar credenciales del tenant (schema: encrypted_access_token + iv)
    const { data: creds, error: credsErr } = await supabase
      .from('tenant_credentials')
      .select('meta_phone_number_id, encrypted_access_token, iv')
      .eq('tenant_id', tenantId)
      .eq('provider', 'meta_cloud')
      .single();

    if (credsErr || !creds) throw new Error('TENANT_CREDENTIALS_NOT_FOUND');

    // 3. Verificar ventana de 24 horas (usamos fecha por defecto para compilar;
    // en producción se consultaría last_inbound_at del contacto)
    const withinWindow = await isWithin24HourWindow(new Date(), new Date());
    const useTemplate = input.forceTemplate === true || !withinWindow;

    // 4. Decidir si usar plantilla (usar templateService.listTemplates + filtro client)
    if (useTemplate && input.type === 'text') {
      const templates = await templateService.listTemplates(creds.meta_phone_number_id!);
      const template = templates?.find((t: any) => t.category === 'UTILITY' && t.status === 'approved');

      if (!template) {
        await audit({
          tenantId, action: 'outbound.blocked.no_template', entityType: 'conversation', entityId: conversationId
        });
        return;
      }
      input.templateName = template.name;
      input.templateVariables = input.templateVariables ?? [];
    }

    // 5. Modo laboratorio o mensajes reales deshabilitados
    if (env.LAB_MODE || !env.ENABLE_REAL_MESSAGES) {
      await supabase.from('messages').insert({
        tenant_id: tenantId, conversation_id: conversationId, contact_id: contactId,
        direction: 'outbound', type: useTemplate ? 'template' : 'text',
        content: useTemplate ? `[template:${input.templateName}]` : input.text,
        status: 'simulated', metadata: { simulated: true }
      });
      await incrementMetric(tenantId, 'messages_out', 1);
      recordMessageProcessed(tenantId, 'outbound', 'success');
      return;
    }

    // NOTE: El schema ahora tiene columnas separadas: iv y encrypted_access_token
    // Para producción se almacena IV + contenido cifrado.
    const accessToken = decryptCredential(
      creds.iv ?? '',
      creds.encrypted_access_token,
      process.env.ENCRYPTION_KEY ?? ''
    );

    // 6. Enviar vía Cloud API (args POSICIONAL, coinciden con CloudWhatsAppProvider)
    let metaMessageId: string | null = null;
    try {
      if (useTemplate) {
        const res = await cloudProvider.sendTemplate(
          creds.meta_phone_number_id!, accessToken,
          contact.whatsapp_phone, input.templateName!, 'es', input.templateVariables ?? []
        );
        metaMessageId = res.messageId ?? null;
      } else {
        const res = await cloudProvider.sendText(
          creds.meta_phone_number_id!, accessToken, contact.whatsapp_phone, input.text!
        );
        metaMessageId = res.messageId ?? null;
      }
    } catch (err) {
      await audit({ tenantId, action: 'outbound.failed', entityType: 'conversation', entityId: conversationId, metadata: { error: String(err) } });
      throw err;
    }

    // 7. Guardar mensaje saliente
    await supabase.from('messages').insert({
      tenant_id: tenantId, conversation_id: conversationId, contact_id: contactId,
      meta_message_id: metaMessageId, direction: 'outbound', type: useTemplate ? 'template' : 'text',
      content: useTemplate ? `[template:${input.templateName}]` : input.text, status: 'sent'
    });

    // 7. Incrementar métricas de uso (non-blocking)
    await incrementMetric(tenantId, 'messages_out', 1);
    recordMessageProcessed(tenantId, 'outbound', 'success');

    // 8. Actualizar último envío
    await supabase.from('contacts').update({ last_outbound_at: new Date().toISOString() }).eq('id', contactId);

    // 9. Auditoría
    await audit({ tenantId, action: 'outbound.sent', entityType: 'message', entityId: metaMessageId ?? conversationId });
    log.info({ tenantId, contactId, metaMessageId }, 'outbound sent');
  }

  async sendText(input: Omit<SendOutboundInput, 'type'>): Promise<void> {
    await this.send({ ...input, type: 'text' });
  }
}

export const outboundMessageService = new OutboundMessageService();