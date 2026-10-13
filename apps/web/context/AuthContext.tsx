/**
 * Autenticación de usuarios para OmniFlow
 *
 * NOTA: Este es un stub de autenticación multi-tenant para el FASE 7A.
 * El login está MOCK por ahora (no conecta con un backend real de auth).
 * La implementación real debe reemplazar las funciones `fakeLogin` / `fakeLogout`
 * con llamadas a tu proveedor de Auth (Supabase Auth, Better Auth, o propio JWT).
 *
 * Endpoints a implementar en el backend:
 * - POST /api/auth/login      { email, password } -> { token, user, tenant }
 * - GET  /api/auth/me         (requiere Bearer token) -> { user, tenant }
 * - DELETE /api/auth/logout   (requiere Bearer token) -> { success: true }
 *
 * La página Settings actual (`app/(dashboard)/settings`) también se conectará
 * con estos endpoints para obtener el nombre del tenant.
 */

import React from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CLIENTE SUPABASE (si lo usas en producción) ---
// DESARROLLO: Forzamos mock para evitar dependencias de env
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
// const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
//   ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
//   : null;
const supabase = null; // Forzar mock en desarrollo

// --- TIPOS ---

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  vertical: 'clinic' | 'real-estate' | 'esthetics';
  plan: 'growth' | 'scale';
}

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  tenant: Tenant;
  role: 'owner' | 'admin' | 'agent';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  tenant: Tenant;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tenant: Tenant | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  loginWithToken: (token: string) => void;
  logout: () => void;
}

// --- LOGICA DE LOGIN (STUB - MOCK / PRODUCCION) ---

/**
 * Intenta autenticar contra el backend real.
 * FALLBACK: si no hay backend configurado, usa el mock.
 */
// Para desarrollo, siempre usamos mock (supabase está forzado a null)
async function fakeLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  // Validar que no esté vacío
  if (!credentials.email.trim() || !credentials.password.trim()) {
    return Promise.reject(new Error('Por favor ingresa email y contraseña'));
  }

  // SIMULAR latencia de red y devolver mock
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          id: 'usr_mock_' + Math.random().toString(36).substring(2, 9),
          email: credentials.email,
          name: credentials.email.split('@')[0],
          tenant_id: 'tenant_mock_' + Math.random().toString(36).substring(2, 9),
          tenant: {
            id: 'tenant_mock_' + Math.random().toString(36).substring(2, 9),
            name: 'Apex Dynamics',
            slug: 'apex-dynamics',
            vertical: 'clinic',
            plan: 'scale',
          },
          role: 'owner',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            credentials.email.split('@')[0]
          )}&background=00F2FE&color=111225`,
        },
        token: 'mock_token_' + Math.random().toString(36).substring(2, 20),
        tenant: {
          id: 'tenant_mock_' + Math.random().toString(36).substring(2, 9),
          name: 'Apex Dynamics',
          slug: 'apex-dynamics',
          vertical: 'clinic',
          plan: 'scale',
        },
      });
    }, 600); // Simula latencia de red
  });
}

/**
 * Simula un login exitoso para desarrollo.
 * TODO: En producción, reemplazar con la llamada real al backend.
 */
function fakeLogout() {
  localStorage.removeItem('omniflow_token');
  localStorage.removeItem('omniflow_user');
  localStorage.removeItem('omniflow_tenant');
}

/**
 * Recupera el usuario de sesión si ya estaba logueado (persistencia básica)
 */
function loadPersistedUser(): User | null {
  try {
    const stored = localStorage.getItem('omniflow_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Guarda el usuario en localStorage (persistencia básica — TODO: sessionStorage / cookie segura en producción)
 */
function storeUser(user: User, token: string) {
  try {
    localStorage.setItem('omniflow_user', JSON.stringify(user));
    localStorage.setItem('omniflow_token', token);
    localStorage.setItem('omniflow_tenant', JSON.stringify(user.tenant));
  } catch {
    console.warn('No se pudo persistir el usuario en localStorage');
  }
}

// --- CONTEXT ---

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Cargar usuario de sesión si existe
    const persisted = loadPersistedUser();
    if (persisted) {
      setUser(persisted);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fakeLogin(credentials);
    storeUser(response.user, response.token);
    setUser(response.user);
    return response;
  };

  const loginWithToken = (token: string) => {
    const stored = loadPersistedUser();
    if (stored) {
      setUser(stored);
    }
    localStorage.setItem('omniflow_token', token);
  };

  const logout = () => {
    fakeLogout();
    setUser(null);
  };

  const value = React.useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    tenant: user?.tenant ?? null,
    login,
    loginWithToken,
    logout,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
