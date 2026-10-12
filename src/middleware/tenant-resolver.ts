import type { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../lib/supabase';

export function createTenantResolver() {
  return async function tenantResolver(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Primero intentar resolver por headers o query params
    let tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId && typeof req.query.tenant_id === 'string') {
      tenantId = req.query.tenant_id;
    }

    // Para webhooks de Meta, resolver por phone_number_id
    if (!tenantId && req.method === 'POST' && req.body) {
      const body = req.body as any;
      const phoneNumberId = body?.entry?.[0]?.changes?.[0]?.value?.phone_number_id;
      if (phoneNumberId) {
        try {
          const supabase = getSupabaseAdmin();
          const { data: credential, error } = await supabase
            .from('tenant_credentials')
            .select('tenant_id')
            .eq('meta_phone_number_id', phoneNumberId)
            .eq('status', 'active')
            .single();

          if (!error && credential) {
            tenantId = credential.tenant_id;
          }
        } catch (err) {
          console.error('Error resolving tenant by phone number:', err);
        }
      }
    }

    if (tenantId) {
      // Cargar tenant y adjuntarlo al request
      try {
        const supabase = getSupabaseAdmin();
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('id, name, slug, vertical, timezone, settings, status')
          .eq('id', tenantId)
          .single();

        if (!error && tenant) {
          (req as any).tenant = tenant;
          (req as any).tenantId = tenantId;
        } else {
          console.warn(`Tenant ${tenantId} no encontrado`);
        }
      } catch (err) {
        console.error('Error loading tenant:', err);
      }
    }

    next();
  };
}