/**
 * ProtectedRoute — Route guard para el auth multi-tenant
 *
 * Redirige al usuario al login si NO está autenticado,
 * usando `Navigate` de react-router-dom.
 *
 * Uso:
 *   <ProtectedRoute>
 *     <Inbox />
 *   </ProtectedRoute>
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Mientras el contexto carga, no redirigimos — mostramos un spinner
  // (el loader del layout lo maneja; aquí solo evitamos flash)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-midnight-indigo via-dark-indigo to-purple-900">
        <div className="w-10 h-10 border-4 border-electric-cyan/30 border-t-electric-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <></>;
}

export default ProtectedRoute;
