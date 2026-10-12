import { getSupabaseAdmin } from '../../lib/supabase';
import { Env } from '../schemas/env.schema';

/**
 * Configuración dinámica del sistema
 * Cachea configuración de Supabase con TTL
 */

interface Setting<T = unknown> {
  key: string;
  value: T;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  updated_at: Date;
}

class SettingsService {
  private readonly supabase = getSupabaseAdmin();
  private cache = new Map<string, { value: any; expires: number }>();
  private readonly CACHE_TTL_MS = 30000; // 30 segundos

  async get<T>(key: string, defaultValue?: T): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value as T;
    }

    try {
      const { data, error } = await this.supabase
        .from('settings')
        .select('value, type')
        .eq('key', key)
        .single();

      if (error || !data) {
        return defaultValue as T;
      }

      let value: any = data.value;
      if (data.type === 'json') {
        value = JSON.parse(value);
      } else if (data.type === 'number') {
        value = Number(value);
      } else if (data.type === 'boolean') {
        value = value === 'true';
      }

      this.cache.set(key, {
        value,
        expires: Date.now() + this.CACHE_TTL_MS,
      });

      return value as T;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return defaultValue as T;
    }
  }

  async set<T>(key: string, value: T, type: 'string' | 'number' | 'boolean' | 'json' = 'string'): Promise<void> {
    let storedValue: string = value as unknown as string;
    if (type === 'json') {
      storedValue = JSON.stringify(value);
    } else if (type === 'number') {
      storedValue = String(value);
    } else if (type === 'boolean') {
      storedValue = value ? 'true' : 'false';
    }

    await this.supabase
      .from('settings')
      .upsert({
        key,
        value: storedValue,
        type,
        updated_at: new Date(),
      }, {
        onConflict: 'key',
      });

    this.cache.set(key, {
      value,
      expires: Date.now() + this.CACHE_TTL_MS,
    });
  }

  async delete(key: string): Promise<void> {
    await this.supabase.from('settings').delete().eq('key', key);
    this.cache.delete(key);
  }

  async loadDefaults(env: Env): Promise<void> {
    // Cargar configuración por defecto basada en entorno
    const defaults: Record<string, any> = {
      lab_mode: env.LAB_MODE,
      enable_real_messages: env.ENABLE_REAL_MESSAGES,
      guardrails_strict: env.GUARDRAILS_STRICT,
      human_escalation_required: env.HUMAN_ESCALATION_REQUIRED,
      whatsapp_provider: env.WHATSAPP_PROVIDER,
      ai_model: env.DEFAULT_MODEL,
      ai_fallback_model: env.FALLBACK_MODEL,
    };

    for (const [key, value] of Object.entries(defaults)) {
      await this.upsertDefault(key, value);
    }
  }

  private async upsertDefault(key: string, value: any): Promise<void> {
    const { data } = await this.supabase
      .from('settings')
      .select('key')
      .eq('key', key)
      .maybeSingle();

    if (!data) {
      await this.set(key, value);
    }
  }
}

export const settingsService = new SettingsService();