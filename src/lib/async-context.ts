import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  vertical: string;
  wabaId?: string;
  phoneNumberId?: string;
}

const tenantContext = new AsyncLocalStorage<TenantContext>();

/**
 * Ejecuta función con contexto de tenant
 */
export function runWithTenantContext<T>(
  context: TenantContext,
  fn: () => T
): T {
  return tenantContext.run(context, fn);
}

/**
 * Obtiene contexto de tenant actual
 */
export function getTenantContext(): TenantContext | undefined {
  return tenantContext.getStore();
}

/**
 * Obtiene tenantId actual o lanza error
 */
export function requireTenantId(): string {
  const ctx = getTenantContext();
  if (!ctx?.tenantId) {
    throw new Error('Tenant context not available');
  }
  return ctx.tenantId;
}

/**
 * Obtiene vertical actual
 */
export function getCurrentVertical(): string | undefined {
  return getTenantContext()?.vertical;
}

/**
 * Middleware factory para Express/Next.js
 */
export function createTenantMiddleware() {
  return (req: any, res: any, next: () => void) => {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenant_id;
    const vertical = req.headers['x-vertical'] || 'clinic';

    if (tenantId) {
      runWithTenantContext({ tenantId, vertical }, next);
    } else {
      next();
    }
  };
}