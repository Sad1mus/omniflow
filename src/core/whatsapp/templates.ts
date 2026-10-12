import { getSupabaseAdmin } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { TemplateNotApprovedError, ProviderError } from '../../lib/errors';
import type { Template } from './types';

export class TemplateService {
  private readonly supabase = getSupabaseAdmin();
  private readonly cache = new Map<string, Template | null>();
  private readonly CACHE_TTL = 300000; // 5 minutos

  /**
   * Lista plantillas aprobadas para un WABA
   */
  async listTemplates(phoneNumberId: string): Promise<Template[]> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('phone_number_id', phoneNumberId)
      .eq('status', 'approved');

    if (error) throw error;
    return data;
  }

  /**
   * Busca una plantilla por su slug para el tenant
   */
  async getTemplate(
    tenantId: string,
    templateName: string,
    phoneNumberId: string
  ): Promise<Template | null> {
    const cached = this.cache.get(`${tenantId}:${templateName}`);
    if (cached !== undefined) {
      return cached;
    }

    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('name', templateName)
      .single();

    this.cache.set(`${tenantId}:${templateName}`, error ? null : data);
    return error ? null : data;
  }

  /**
   * Verifica si una plantilla aprobada puede usarse fuera de la ventana de 24h
   */
  async requiresApproval(tenantId: string, phoneNumberId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone_number_id', phoneNumberId)
      .eq('status', 'approved')
      .limit(1);

    if (error) {
      logger.warn('Error checking template approval: ' + error.message);
      return true; // fall back to strict: no template
    }
    return data.length === 0;
  }

  /**
   * Guarda el estado de envío de una plantilla
   */
  async recordTemplateSent(
    tenantId: string,
    templateName: string,
    phoneNumberId: string,
    languageCode: string,
    components?: Record<string, unknown>[]
  ): Promise<void> {
    const template = await this.getTemplate(tenantId, templateName, phoneNumberId);
    if (!template) {
      const { error } = await this.supabase.from('templates').insert({
        tenant_id: tenantId,
        name: templateName,
        phone_number_id: phoneNumberId,
        language: languageCode,
        category: 'UTILITY' as const,
        status: 'pending',
        content: { language: { code: languageCode } },
        components,
      });
      if (error) throw error;
    }
  }
}

export const templateService = new TemplateService();