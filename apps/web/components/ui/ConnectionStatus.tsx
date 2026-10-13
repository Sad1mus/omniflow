/**
 * ConnectionStatus — Indicador de conexión Meta Cloud API
 *
 * Muestra el estado verde "Meta Cloud API Connected • 99.8% Sync" como en el diseño.
 * Recibe el estado desde el contexto del backend (puede venir del fetchAPI
 * al `/api/tenant/status`).
 */

import React from 'react';

interface ConnectionStatusProps {
  connected: boolean;
  syncRate: number; // Ej. 99.8
}

export function ConnectionStatus({ connected, syncRate }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full
                      bg-emerald-500/10 border border-emerald-500/20
                      backdrop-blur-md">
      <div className="w-2 h-2 rounded-full bg-emerald-500
                      animate-pulse"
           style={{ boxShadow: '0 0 10px #10B981' }} />
      <span className="text-label-sm text-emerald-400">
        {connected ? `Meta Cloud API Connected • ${syncRate}% Sync` : 'Desconectado'}
      </span>
    </div>
  );
}