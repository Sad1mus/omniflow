import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;
let supabaseAnon: SupabaseClient | null = null;

/**
 * Cliente Supabase con service_role key (admin)
 * Solo usar en servidor/worker, nunca en cliente
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
    }
    supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

/**
 * Cliente Supabase con anon key (público)
 * Para operaciones que requieren RLS con usuario autenticado
 */
export function getSupabaseAnon(): SupabaseClient {
  if (!supabaseAnon) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY son requeridos');
    }
    supabaseAnon = createClient(url, key);
  }
  return supabaseAnon;
}

/**
 * Crea cliente Supabase con token de usuario específico
 * Útil para RLS con contexto de usuario
 */
export function getSupabaseUser(accessToken: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL es requerido');
  }
  return createClient(url, process.env.SUPABASE_ANON_KEY || '', {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * Ejecuta query con retry básico para transitorios
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 100
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(r => setTimeout(r, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}