import { getSupabaseAdmin } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';

const log = logger.child({ module: 'audit' });

export interface AuditInput {
  tenantId: string;
  action: string;
  actorType?: 'system' | 'agent' | 'owner' | 'user';
  actorId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registra una entrada en audit_logs. Nunca lanza errores hacia arriba.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('audit_logs').insert({
      tenant_id: input.tenantId,
      actor_type: input.actorType ?? 'system',
      actor_id: input.actorId ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) log.error({ err: error, input }, 'audit log write failed');
  } catch (err) {
    log.error({ err, input }, 'audit service crashed');
  }
}