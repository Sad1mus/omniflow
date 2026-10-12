/**
 * Baileys provider (NOT FOR PRODUCTION USE)
 * Only for development/testing
 */
import type { IWhatsAppProvider } from '../types';

export class BaileysProvider implements IWhatsAppProvider {
  async sendText(): Promise<{ messageId: string }> {
    throw new Error('Baileys not implemented - use Cloud API');
  }

  async sendTemplate(): Promise<{ messageId: string }> {
    throw new Error('Baileys not implemented - use Cloud API');
  }

  async downloadMedia(): Promise<{ buffer: Buffer; mimeType: string }> {
    throw new Error('Baileys not implemented - use Cloud API');
  }
}