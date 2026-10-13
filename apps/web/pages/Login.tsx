/**
 * Login.tsx — Página de login conectada al backend real
 *
 * Usa el AuthContext real con POST /auth/login.
 * Valida credenciales contra el backend (user: admin@omniflow.com, pass: password123).
 * Muestra estado de loading y mensajes de error.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function LoginPage() {
  const { user, isLoading: authLoading, login, logout, checkAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Si ya hay usuario logueado, llevar al dashboard
  useEffect(() => {
    if (user) {
      navigate('/inbox');
    }
  }, [user, navigate]);

  // Intentar checkAuth al montar si no hay usuario
  useEffect(() => {
    if (!user && !authLoading) {
      checkAuth();
    }
  }, [user, authLoading]);

  const handleLogin = async () => {
    setError(null);

    try {
      await login({ email, password });
      navigate('/inbox');
    } catch (err: any) {
      setError(err?.message || 'Credenciales inválidas');
      console.error('Login error:', err);
    }
  };

  // Si el contexto de auth aún no cargó, mostrar spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-midnight-indigo via-dark-indigo to-purple-900">
        <div className="w-10 h-10 border-4 border-electric-cyan/30 border-t-electric-cyan rounded-full animate-spin" />
      </div>
    );
  }

  // Si no hay usuario aún y no cargando, intentar checkAuth
  if (!user && !authLoading) {
    // Ya intentó checkAuth en useEffect, así que mostramos el formulario
  }

  return (
    <div
      className="
        min-h-screen
        flex items-center justify-center
        bg-[gradient:var(--bg-gradient)]
        text-white
      "
    >
      <div className="relative z-20 w-full max-w-md">
        <GlassCard level={3} padding="lg" rounded="xl">
          <div className="text-center py-12">

            <div className="w-14 h-14 mx-auto mb-6
                           bg-gradient-to-br from-electric-cyan to-luminous-purple
                           rounded-full flex items-center justify-center
                           shadow-[0_0_20px_rgba(0,242,254,0.4)]">
              <svg
                className="w-7 h-7 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M21.5 16.5l-4.5-4.5A2.12 2.12 0 0 1 15.5 11H14a2 2 0 0 0-2 1.73l-1.44 2.88A2.12 2.12 0 0 1 6.5 17l4.5 4.5A2.12 2.12 0 0 1 9.5 20.5H18a2 2 0 0 0 1.98-3.07l-1.32-3.12Z" />
                <path d="M12 3v4h4" />
                <path d="M12 15h.01M5 12h5.98c.55 0 1.06.22 1.47.64l3.09 3.08a1 1 0 0 1 .17 1.39l-1.57 5.08a1 1 0 0 1-1.41 0L3.82 13.13a1 1 0 0 1 .12-1.28l3.14-2.16c.39-.26.68-.61.89-1.02.22-.42.33-.87.33-1.34Z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold mb-3 text-white">
              Bienvenido a OmniFlow
            </h1>
            <p className="text-lavender-slate mb-8">
              Conecta WhatsApp Business para gestionar conversaciones automáticas.
            </p>

            {/* Formulario de login */}
            {error && (
              <div className="mb-6 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div>
                <label
                  className="block text-body-sm text-lavender-slate mb-2.5
                             font-medium block"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="
                    w-full bg-white/5 backdrop-blur-md border border-white/10
                    rounded-lg px-4 py-3 text-white placeholder-lavender-slate
                    focus:outline-none focus:ring-2 focus:ring-electric-cyan/30
                    transition-all duration-200
                  "
                />
              </div>

              <div>
                <label
                  className="block text-body-sm text-lavender-slate mb-2.5
                             font-medium block"
                  htmlFor="password"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="
                    w-full bg-white/5 backdrop-blur-md border border-white/10
                    rounded-lg px-4 py-3 text-white placeholder-lavender-slate
                    focus:outline-none focus:ring-2 focus:ring-electric-cyan/30
                    transition-all duration-200
                  "
                />
              </div>

              <button
                type="submit"
                className="
                  w-full
                  mt-4 bg-gradient-to-r from-electric-cyan to-luminous-purple
                  text-white font-semibold py-3 rounded-full
                  shadow-[0_8px_20px_rgba(0,242,254,0.3)]
                  hover:shadow-[0_12px_28px_rgba(0,242,254,0.4)]
                  transition-all duration-300
                "
              >
                Iniciar sesión
              </button>

              <p className="text-center text-xs text-lavender-slate mt-4">
                ¿No tienes cuenta? <span className="underline underline-offset-2
                                   hover:text-electric-cyan cursor-pointer"
                                   onClick={() => navigate('/auth/meta/callback')}>
                  Ingresar con WhatsApp Business
                </span>
              </p>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}