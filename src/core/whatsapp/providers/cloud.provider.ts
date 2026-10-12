import { env } from '../../../config/env';
import { fetchWithRetry } from '../../../lib/http';
import { logger } from '../../../lib/logger';
import { ProviderError } from '../../../lib/errors';

/**
 * Proveedor oficial de WhatsApp Cloud API
 * Usa la Graph API de Meta para enviar y recibir mensajes
 */
export class CloudWhatsAppProvider {
  private readonly apiVersion = 'v21.0';
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  /**
   * Envía un mensaje de texto usando WhatsApp Cloud API
   */
  async sendText(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    text: string
  ): Promise<{ messageId: string }> {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: text,
      },
    };

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new ProviderError(
        `Cloud API send text failed: ${response.status} ${errorBody}`,
        'cloud',
        response.status
      );
    }

    const result = await response.json();
    logger.info({ messageId: result?.messages?.[0]?.id }, 'Message sent via Cloud API');
    return { messageId: result.messages[0].id };
  }

  /**
   * Envía un mensaje usando una plantilla aprobada por Meta
   */
  async sendTemplate(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    templateName: string,
    languageCode: string = 'es_ES',
    components: any[] = []
  ): Promise<{ messageId: string }> {
    const url = `${this.baseUrl}/${phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new ProviderError(
        `Cloud API send template failed: ${response.status} ${errorBody}`,
        'cloud',
        response.status
      );
    }

    const result = await response.json();
    logger.info({ messageId: result?.messages?.[0]?.id }, 'Template sent via Cloud API');
    return { messageId: result.messages[0].id };
  }

  /**
   * Descarga media (imágenes, audio, documentos) desde Meta
   */
  async downloadMedia(
    mediaId: string,
    accessToken: string
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const url = `${this.baseUrl}/${mediaId}`;
    const response = await fetchWithRetry(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new ProviderError(
        `Cloud API download media failed: ${response.status}`,
        'cloud',
        response.status
      );
    }

    const metadata = await response.json();
    const downloadUrl = metadata?.url;

    if (!downloadUrl) {
      throw new ProviderError('No download URL in media metadata', 'cloud');
    }

    const mediaResponse = await fetchWithRetry(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mediaResponse.ok) {
      throw new ProviderError(
        `Cloud API media download failed: ${mediaResponse.status}`,
        'cloud',
        mediaResponse.status
      );
    }

    const buffer = Buffer.from(await mediaResponse.arrayBuffer());
    const mimeType = mediaResponse.headers.get('content-type') || metadata?.mime_type || 'application/octet-stream';

    return { buffer, mimeType };
  }
}

export const cloudProvider = new CloudWhatsAppProvider();