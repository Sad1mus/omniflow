import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { cloudProvider } from './providers/cloud.provider';
import type { IWhatsAppProvider, WhatsAppProvider } from './types';

/**
 * Factory para obtener el proveedor WhatsApp activo
 * Por defecto usa Cloud API (oficial de Meta)
 */
export async function getWhatsAppProvider(): Promise<IWhatsAppProvider> {
  const provider = env.WHATSAPP_PROVIDER as WhatsAppProvider;

  if (provider === 'baileys') {
    logger.warn('⚠️  Using Baileys - NOT RECOMMENDED for production');
    // Import dinámico para evitar que se cargue si no se usa
    const { BaileysProvider } = await import('./providers/baileys.provider');
    return new BaileysProvider();
  }

  logger.info('Using Cloud API provider (Meta official)');
  return cloudProvider as unknown as IWhatsAppProvider;
}

export function isCloudProvider(): boolean {
  return env.WHATSAPP_PROVIDER === 'cloud';
}