/**
 * Inbox.tsx — Vista de Inbox con diseño exacto al code.html
 *
 * Esta página replica la estructura y estilo exactos del código HTML de referencia.
 * Características clave:
 * - 6 ítems de conversación mock con avatares, últimos mensajes, badges
 * - Colores exactos: #00F2FE (electric-cyan), #0A0B1E (midnight-indigo),
 *   #150D30 (purple-900), #b9cacb (lavender-slate), #e1e0fb (light-gray)
 * - Fondo gradient: linear-gradient(135deg, #0A0B1E 0%, #150D30 100%)
 * - Glassmorphism en cada conversación
 * - FloatingDock en la parte inferior
 * - StatusBadges para estados de mensaje y proveedor
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link, Navigate } from 'react-router-dom';
import { WhatsAppConnectButton } from '@/components/ui/WhatsAppConnectButton';
import { FloatingDock } from '@/components/ui/FloatingDock';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

type ProviderColor = { bg: string; border: string; text: string };

type Conversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  provider: 'whatsapp' | 'instagram' | 'sms';
  status: 'active' | 'pending' | 'resolved';
};

const conversations: Conversation[] = [
  {
    id: 'conv_1',
    name: 'Sofía Rodríguez',
    avatar: 'https://ui-avatars.com/api/?name=Sofia%20Rodriguez&background=00F2FE&color=111225',
    lastMessage: 'Hola! Consultando sobre la propiedad en calle 12',
    time: '2h',
    unreadCount: 3,
    provider: 'whatsapp',
    status: 'active',
  },
  {
    id: 'conv_2',
    name: 'Dr. Álvarez',
    avatar: 'https://ui-avatars.com/api/?name=Dr.%20Álvarez&background=0A0B1E&color=ffffff',
    lastMessage: '¿Disponibilidad para consulta mañana a las 10am?',
    time: '5h',
    unreadCount: 0,
    provider: 'whatsapp',
    status: 'active',
  },
  {
    id: 'conv_3',
    name: 'María González',
    avatar: 'https://ui-avatars.com/api/?name=María%20González&background=150D30&color=ffffff',
    lastMessage: 'El template ya está listo para enviar',
    time: '1d',
    unreadCount: 1,
    provider: 'instagram',
    status: 'pending',
  },
  {
    id: 'conv_4',
    name: 'Carlos Mendoza',
    avatar: 'https://ui-avatars.com/api/?name=Carlos%20Mendoza&background=b9cacb&color=111225',
    lastMessage: 'Me interesa el plan scale para mi clínica',
    time: '3h',
    unreadCount: 0,
    provider: 'whatsapp',
    status: 'active',
  },
  {
    id: 'conv_5',
    name: 'Dra. Petter',
    avatar: 'https://ui-avatars.com/api/?name=Dra.%20Petter&background=00F2FE&color=111225',
    lastMessage: 'Nuevo lead entrando por el formulario web',
    time: '12m',
    unreadCount: 7,
    provider: 'sms',
    status: 'active',
  },
  {
    id: 'conv_6',
    name: 'Ticket #402',
    avatar: 'https://ui-avatars.com/api/?name=Ticket%20402&background=e1e0fb&color=111225',
    lastMessage: 'Solicitud de reporte de ventas mensuales',
    time: '8h',
    unreadCount: 0,
    provider: 'sms',
    status: 'resolved',
  },
];

// Mapeo de proveedor a color de badge
const providerBadgeColors: Record<Conversation['provider'], ProviderColor> = {
  whatsapp: { bg: 'bg-electric-cyan/20', border: 'border-electric-cyan/30', text: 'text-electric-cyan' },
  instagram: { bg: 'bg-violet-500/20', border: 'border-violet-500/30', text: 'text-violet-300' },
  sms: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
};

function getProviderBadge(provider: Conversation['provider']) {
  const colors = providerBadgeColors[provider];
  return (
    <StatusBadge
      variant="unread"
      size="sm"
      className={cn(colors.bg, colors.border, colors.text)}
    >
      {provider}
    </StatusBadge>
  );
}

export function InboxPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header con título y búsqueda */}
      <header className="
        padding-6 bg-gradient-to-b from-midnight-indigo via-dark-indigo to-purple-900
        text-white border-b border-white/10
        backdrop-blur-3xl
      ">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-electric-cyan"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <path d="M20 4l-1.41-1.42A7 7 0 0 0 13.06.85l4.58 4.59a7 7 0 0 0 9.9 0l4.58-4.59A7 7 0 0 0 20 4zM8.6 6.6C8.2 5.5 7 5.1 6 5.1s-.2.4-.31.5L3.1 11.63l3.08 3.85a.5.5 0 0 0 .12.37l-1.07 2.36a5 5 0 0 1-4.79 0l-1.07-2.36.31-.5c-.09-.11-.16-.26-.21-.4l-3.05-3.9a.5.5 0 0 0-.65.17l-.75 1.58c-.06.11-.06.26 0 .37l2.31 3.01a3.5 3.5 0 0 0 .62 0l2.31-3.01c.06-.11.06-.26 0-.37l-.75-1.58a.5.5 0 0 0-.65-.17l-3.05 3.9a.5.5 0 0 0-.12-.37L8.6 6.6z" />
            </svg>
            <span className="text-xl font-bold">OmniFlow Inbox</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón WhatsApp Connect desde el header */}
            <WhatsAppConnectButton
              tenantId={user?.tenant?.id ?? 'tenant_mock'}
              onSuccess={() => {}}
              onError={() => {}}
            />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="py-6 max-w-7xl mx-auto">
        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-lavender-slate"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M21 21l-3-3m0-9l3-3m-9 3l3 3m3-3v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h6a2 2 0 0 1 2 2v4.14"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="
                pl-10 pr-4 py-3 px-3
                bg-white/5 backdrop-blur-md border border-white/10
                rounded-full text-white placeholder-lavender-slate
                focus:outline-none focus:ring-2 focus:ring-electric-cyan/30
                transition-all duration-200
                w-64
              "
            />
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConversations.map((conv) => (
            <article
              key={conv.id}
              className="
                group
                rounded-xl backdrop-blur-md
                bg-white/5 border border-white/10
                overflow-hidden
                transition-all duration-300
                hover:bg-white/10 hover:shadow-lg
              "
            >
              <div className="p-5 flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-lg flex-shrink-0">
                  <img
                    src={conv.avatar}
                    alt={conv.name}
                    className="
                      w-full h-full rounded-lg
                      object-cover
                      border-2 border-white/10
                    "
                  />
                </div>

                {/* Información de la conversación */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3
                      className="text-sm font-medium text-white truncate"
                    >
                      {conv.name}
                    </h3>
                    <span
                      className="text-xs text-lavender-slate"
                    >
                      {conv.time}
                    </span>
                  </div>

                  <p
                    className="mt-1 text-body text-lavender-slate/70 truncate"
                    style={{ maxWidth: '220px' }}
                  >
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Badge de estado + contador */}
                <div className="ml-4 flex items-center gap-2">
                  {getProviderBadge(conv.provider)}
                  <StatusBadge
                    variant="unread"
                    size="sm"
                    count={conv.unreadCount > 0 ? conv.unreadCount : undefined}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Estado vacío */}
        {filteredConversations.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-lavender-slate/60">
              No hay conversaciones con tu búsqueda
            </p>
          </div>
        )}
      </main>

      {/* Floating Dock siempre visible */}
      <FloatingDock />
    </div>
  );
}

export default InboxPage;