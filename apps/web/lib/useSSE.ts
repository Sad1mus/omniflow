/**
 * OmniFlow CRM — Frontend
 * Server-Sent Events hook para recibir mensajes entrantes en tiempo real
 * sin recargar la página.
 */

import { useEffect, useRef, useState } from 'react';

export interface IncomingMessage {
  id: string;
  from: string; // phone / contact id
  text: string;
  senderType: 'ia' | 'humano'; // 🤖 IA o 👤 Humano
  timestamp: string;
}

/**
 * Conecta a SSE del backend para escuchar nuevos mensajes entrantes.
 * Emite un evento personalizado "omniflow:inbox-update" que los componentes
 * pueden suscribir.
 */
export function useSSE(endpoint: string) {
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('omniflow_token');
    const url = `${endpoint}${token ? `?token=${token}` : ''}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: IncomingMessage = JSON.parse(event.data);
        // Reemitimos como evento personalizado para que el inbox lo escuche
        window.dispatchEvent(new CustomEvent('omniflow:inbox-update', { detail: data }));
      } catch (e) {
        console.error('Error parseando SSE message:', e);
      }
    };

    es.onerror = () => {
      console.warn('SSE connection closed/retrying...');
    };

    return () => {
      es.close();
    };
  }, [endpoint]);

  return { error };
}