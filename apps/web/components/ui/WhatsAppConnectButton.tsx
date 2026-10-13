/**
 * WhatsAppConnectButton — Botón para iniciar el flujo de OAuth de Meta
 * (Embedded Signup para WhatsApp Business Cloud API)
 *
 * - Usa GlassCard level 3 (efecto flotante)
 * - Abre el dialog de autorización de Meta con los scopes necesarios
 * - Incluye anti-replay mediante timestamp en el state
 * - Diseño glassmorphism premium con ícono pulsing
 */

import React, { useCallback } from 'react';
import { Wifi } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface WhatsAppConnectButtonProps {
  tenantId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Genera un state para el OAuth de Meta:
 * - tenantId: identificador del tenant actual
 * - nonce: valor aleatorio para evitar replay attacks
 * - timestamp: para validar que el state no es muy viejo
 */
function generateOAuthState(tenantId: string): string {
  const stateObj = {
    tenantId,
    nonce: Math.random().toString(36).substring(2, 15),
    timestamp: Date.now(),
  };
  return JSON.stringify(stateObj);
}

export function WhatsAppConnectButton({
  tenantId,
  onSuccess,
  onError,
}: WhatsAppConnectButtonProps) {
  const handleConnect = useCallback(() => {
    try {
      const state = generateOAuthState(tenantId);
      const scope = [
        'whatsapp_business_management', // Para gestionar WABAs y números
        'whatsapp_business_messaging',  // Para enviar/recibir mensajes
      ].join(',');

      const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
      authUrl.searchParams.set('client_id', import.meta.env.VITE_META_APP_ID);
      authUrl.searchParams.set('redirect_uri', `${import.meta.env.VITE_FRONTEND_URL}/auth/meta/callback`);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('auth_type', 'rerequest');

      // Abrir en nueva ventana/popup (mejor UX)
      window.open(authUrl.toString(), '_blank', 'width=800,height=600');
    } catch (error) {
      console.error('Error iniciando flujo de Meta OAuth:', error);
      onError?.(error?.toString() ?? 'Error desconocido');
    }
  }, [tenantId, onError]);

  return (
    <GlassCard level={3} className="p-6 text-center hover:shadow-[0_12px_28px_rgba(0,242,254,0.4)] transition-shadow duration-300">
      <div className="mb-4">
        <Wifi
          className="w-12 h-12 text-electric-cyan mx-auto animate-pulse"
          style={{
            boxShadow: '0 0 20px #00F2FE',
            animation: 'pulse 2s infinite',
          }}
        />
        <style>
          {`
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(0, 242, 254, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(0, 242, 254, 0); }
              100% { box-shadow: 0 0 0 0 rgba(0, 242, 254, 0); }
            }
          `}
        </style>
      </div>

      <h3 className="text-headline-sm mb-2 text-white">
        Conectar WhatsApp Business
      </h3>
      <p className="text-body-sm text-lavender-slate mb-4">
        Configuración automática vía Meta OAuth
      </p>

      <button
        onClick={handleConnect}
        className="bg-gradient-to-r from-electric-cyan to-luminous-purple
                   text-white font-semibold py-3 px-6 rounded-full
                   shadow-[0_8px_20px_rgba(0,242,254,0.3)]
                   inset-0_1px_1px_rgba(255,255,255,0.4)
                   hover:shadow-[0_12px_28px_rgba(0,242,254,0.4)]
                   transition-all duration-300"
      >
        Iniciar Conexión Oficial
      </button>
    </GlassCard>
  );
}

export default WhatsAppConnectButton;