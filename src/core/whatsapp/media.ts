import { createHash } from 'crypto';
import { getSupabaseAdmin } from '../../lib/supabase';

export class WhatsAppMediaService {
  private readonly supabase = getSupabaseAdmin();

  /**
   * Descarga media de Meta y lo guarda temporalmente
   * NOTA: En implementación real, usar S3 o storage local
   */
  async downloadMedia(mediaId: string, mimeType: string): Promise<Buffer> {
    // TODO: implementar descarga real de Meta Graph API
    // Por ahora, simular
    return Buffer.from('fake-media-content');
  }

  /**
   * Calcula hash de media para deduplicación
   */
  calculateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Guarda metadata de media en DB
   */
  async saveMediaMetadata(
    tenantId: string,
    mediaId: string,
    mimeType: string,
    hash: string
  ) {
    await this.supabase.from('media_assets').upsert({
      tenant_id: tenantId,
      meta_media_id: mediaId,
      mime_type: mimeType,
      hash,
    }, {
      onConflict: 'tenant_id,meta_media_id',
    });
  }
}