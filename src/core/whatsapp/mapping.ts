import { MetaMessage, MetaContact } from '../schemas/webhook.schema';

/**
 * Convierte payloads de Meta en tipos internos
 */
export class WhatsAppMapper {
  /**
   * Convierte mensaje entrante de Meta a tipo interno
   */
  static mapInbound(message: MetaMessage, contact: MetaContact) {
    return {
      waId: contact.wa_id,
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type,
      text: message.text?.body,
      image: message.image ? {
        url: message.image.id, // TODO: descargar media
        caption: message.image.caption,
      } : undefined,
      audio: message.audio ? {
        url: message.audio.id, // TODO: descargar media
        mimeType: message.audio.mime_type,
      } : undefined,
      interactive: message.interactive ? {
        type: message.interactive.type,
        buttonReply: message.interactive.button_reply
          ? {
              id: message.interactive.button_reply.id,
              title: message.interactive.button_reply.title,
            }
          : undefined,
        listReply: message.interactive.list_reply
          ? {
              id: message.interactive.list_reply.id,
              title: message.interactive.list_reply.title,
              description: message.interactive.list_reply.description,
            }
          : undefined,
      } : undefined,
    };
  }

  /**
   * Convierte mensaje saliente a formato de Meta
   */
  static mapOutbound(text: string, templateName?: string, variables?: string[]) {
    if (templateName) {
      return {
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es' },
          components: variables ? [
            {
              type: 'body',
              parameters: variables.map((v, i) => ({
                type: 'text',
                text: v,
                index: String(i + 1),
              })),
            },
          ] : [],
        },
      };
    }

    return {
      type: 'text',
      text: {
        body: text,
      },
    };
  }
}