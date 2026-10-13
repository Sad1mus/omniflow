/**
 * AuthContext.tsx — Autenticación REAL con JWT del backend
 *
 * Flujo:
 * 1. POST /auth/login { email, password } → { token, user, tenant }
 * 2. Guarda JWT en localStorage y decodifica para extraer tenant_id
 * 3. checkAuth() al montar: valida token vigente con GET /auth/me
 *
 * NO USA MOCKS. El backend en src/routes/auth/login.ts
 * implementa un usuario de prueba (admin@omniflow.com / password123).
 */

import React from 'react';

// --- TIPOS ---

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  vertical?: 'clinic' | 'real-estate' | 'esthetics';
  plan?: 'growth' | 'scale';
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
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// --- CONFIGURACIÓN ---

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TOKEN_KEY = 'omniflow_token';
const USER_KEY = 'omniflow_user';

// --- HELPERS ---

/**
 * Decodifica un JWT sin verificar (solo para extraer payload).
 * El backend ya validó la firma; aquí solo leemos el payload.
 */
function decodeJWT(token: string): any {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function loadPersistedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.warn('No se pudo persistir el token');
  }
}

function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    console.warn('No se pudo limpiar la autenticación');
  }
}

// --- CONTEXT ---

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Cargar usuario persistido al montar
  React.useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const token = loadPersistedToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Token inválido o expirado
        clearAuth();
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      const newUser: User = {
        id: data.user.sub || data.user.tenantId,
        email: data.user.email,
        name: data.user.tenantName,
        tenant_id: data.user.tenantId,
        tenant: {
          id: data.tenant.id,
          name: data.tenant.name,
        },
        role: data.user.role || 'owner',
      };
      setUser(newUser);
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      } catch { /* ignore */ }
    } catch (err) {
      console.error('checkAuth error:', err);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Credenciales inválidas');
    }

    const data = await res.json();
    storeToken(data.token);

    // Decodificar JWT para extraer tenant_id y tenant_name
    const payload = decodeJWT(data.token);
    const tenantId = payload?.tenantId || data.tenant.id;
    const tenantName = payload?.tenantName || data.tenant.name;

    const newUser: User = {
      id: payload?.sub || tenantId,
      email: payload?.email || credentials.email,
      name: tenantName,
      tenant_id: tenantId,
      tenant: {
        id: tenantId,
        name: tenantName,
      },
      role: payload?.role || 'owner',
    };

    setUser(newUser);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch { /* ignore */ }

    return {
      user: newUser,
      token: data.token,
      tenant: newUser.tenant,
    };
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const value = React.useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    tenant: user?.tenant ?? null,
    login,
    logout,
    checkAuth,
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