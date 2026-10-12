import { getSupabaseAdmin } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';

const log = logger.child({ module: 'tenants-service' });

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  status: string;
  timezone: string;
  settings: Record<string, unknown>;
}

/**
 * Resuelve el tenant real a partir del phone_number_id de Meta.
 * Busca en tenant_credentials y hace join con tenants.
 */
export async function resolveTenantByPhoneNumberId(
  phoneNumberId: string
): Promise<TenantRecord | null> {
  const supabase = getSupabaseAdmin();

  const { data: cred, error: credErr } = await supabase
    .from('tenant_credentials')
    .select('tenant_id')
    .eq('meta_phone_number_id', phoneNumberId)
    .eq('provider', 'meta_cloud')
    .eq('status', 'active')
    .maybeSingle();

  if (credErr || !cred) {
    log.warn({ err: credErr, phoneNumberId }, 'no active tenant credentials found');
    return null;
  }

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, name, slug, vertical, status, timezone, settings')
    .eq('id', cred.tenant_id)
    .eq('status', 'active')
    .maybeSingle();

  if (tenantErr || !tenant) {
    log.error({ err: tenantErr, tenantId: cred.tenant_id }, 'tenant not found or inactive');
    return null;
  }

  return tenant as TenantRecord;
}