import { getSupabaseAdmin } from '../../lib/supabase';

/**
 * Feature flags de la plataforma
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rollout?: number; // 0-100, porcentaje de rollout
  tenants?: string[]; // IDs de tenants que tienen acceso
  expires_at?: Date;
  updated_at: Date;
}

class FeatureFlagsService {
  private readonly supabase = getSupabaseAdmin();
  private flags = new Map<string, FeatureFlag>();
  private lastRefreshed = 0;
  private readonly REFRESH_INTERVAL = 60000; // 1 minuto

  /**
   * Carga flags desde la base de datos (con caché)
   */
  async loadFlags(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRefreshed < this.REFRESH_INTERVAL && this.flags.size > 0) {
      return;
    }

    const { data, error } = await this.supabase.from('feature_flags').select('*');
    if (!error && data) {
      for (const flag of data as FeatureFlag[]) {
        this.flags.set(flag.key, flag);
      }
    }
    this.lastRefreshed = now;
  }

  /**
   * Verifica si un feature está habilitado para un tenant
   */
  async isEnabled(key: string, tenantId?: string): Promise<boolean> {
    await this.loadFlags();

    const flag = this.flags.get(key);
    if (!flag) {
      console.warn(`Feature flag ${key} no encontrado`);
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Verificar rollout aleatorio
    if (flag.rollout !== undefined && flag.rollout < 100) {
      const hash = this.hashTenant(tenantId);
      if (hash % 100 >= flag.rollout) {
        return false;
      }
    }

    // Verificar si tenant está en lista explícita
    if (flag.tenants && tenantId) {
      if (!flag.tenants.includes(tenantId)) {
        return false;
      }
    }

    // Verificar expiración
    if (flag.expires_at && new Date(flag.expires_at) < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Habilita un feature flag
   */
  async enable(key: string, description?: string): Promise<void> {
    await this.supabase.from('feature_flags').upsert({
      key,
      enabled: true,
      description,
    }, {
      onConflict: 'key',
    });
    this.flags.delete(key);
  }

  /**
   * Deshabilita un feature flag
   */
  async disable(key: string): Promise<void> {
    await this.supabase.from('feature_flags').update({ enabled: false }).eq('key', key);
    this.flags.delete(key);
  }

  /**
   * Establece rollout porcentual
   */
  async setRollout(key: string, percentage: number): Promise<void> {
    await this.supabase.from('feature_flags').update({ rollout: percentage }).eq('key', key);
    this.flags.delete(key);
  }

  /**
   * Agrega tenant a lista explícita
   */
  async addToTenantList(key: string, tenantId: string): Promise<void> {
    const flag = this.flags.get(key);
    const tenants = flag?.tenants || [];
    if (!tenants.includes(tenantId)) {
      tenants.push(tenantId);
      await this.supabase.from('feature_flags').update({ tenants }).eq('key', key);
      this.flags.delete(key);
    }
  }

  private hashTenant(tenantId: string | undefined): number {
    if (!tenantId) return Math.floor(Math.random() * 100);
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      const char = tenantId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }
}

export const featureFlags = new FeatureFlagsService();

// Feature flags conocidos
export const FEATURES = {
  LAB_MODE: 'lab_mode',
  REAL_MESSAGES: 'real_messages',
  OWNER_COMMANDS: 'owner_commands',
  MULTI_VERTICAL: 'multi_vertical',
  ATTRIBUTION: 'attribution',
  CONVERSATION_TRACKING: 'conversation_tracking',
} as const;

export type FeatureName = (typeof FEATURES)[keyof typeof FEATURES];