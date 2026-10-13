/**
 * FloatingDock — Barra de navegación inferior tipo "dock" flotante
 *
 * Replica el diseño del Inbox: barra glassmorphism en la parte inferior
 * con 4 iconos (MessageSquare, AccountTree, Science, Settings).
 * El elemento activo se resalta con un gradiente eléctrico y glow.
 */

import React, { ReactNode } from 'react';
import {
  MessageSquare,
  FolderTree,
  Brain,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface DockItem {
  href: string;
  icon: LucideIcon;
  tooltip: string;
}

const dockItems: DockItem[] = [
  { href: '/inbox', icon: MessageSquare, tooltip: 'Mensajes' },
  { href: '/flow', icon: FolderTree, tooltip: 'Flujos' },
  { href: '/ai-lab', icon: Brain, tooltip: 'AI Lab' },
  { href: '/settings', icon: Settings, tooltip: 'Ajustes' },
];

function getActiveHref(pathname: string): string {
  // El Inbox tiene subrutas? Si pathname === /inbox o empieza con /inbox/
  if (pathname === '/' || pathname.startsWith('/inbox')) return '/inbox';
  if (pathname.startsWith('/flow')) return '/flow';
  if (pathname.startsWith('/ai-lab')) return '/ai-lab';
  if (pathname.startsWith('/settings')) return '/settings';
  return pathname;
}

function dockItemClasses(href: string, isActive: boolean) {
  return isActive
    ? 'group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-electric-cyan to-luminous-purple shadow-[0_12px_30px_rgba(0,242,254,0.5)] scale-105 transition-all duration-300'
    : 'group relative flex items-center justify-center w-14 h-14 rounded-full bg-white/5 hover:bg-white/15 transition-all duration-300';
}

function iconClasses(isActive: boolean) {
  return isActive
    ? 'w-6 h-6 transition-transform duration-300 text-white group-hover:scale-110'
    : 'w-6 h-6 transition-transform duration-300 text-lavender-slate group-hover:scale-110';
}

function tooltipClasses(isActive: boolean) {
  return `absolute -top-10 px-2.5 py-1.5 bg-midnight-indigo/90 border border-white/15 backdrop-blur-xl rounded-lg text-xs text-white ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg`;
}

export function FloatingDock() {
  const location = useLocation();
  const active = getActiveHref(location.pathname);

  const navClasses = 'flex items-center gap-3 px-5 py-3.5 bg-white/8 border border-white/12 backdrop-blur-3xl shadow-2xl rounded-full';

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className={navClasses}>
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={dockItemClasses(item.href, isActive)}
              aria-label={item.tooltip}
              title={item.tooltip}
            >
              {/* Glow bajo el ítem activo */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)',
                  }}
                />
              )}

              <Icon
                className={iconClasses(isActive)}
                strokeWidth={isActive ? 2.2 : 2}
              />

              {/* Tooltip flotante (solo en hover) */}
              <span className={tooltipClasses(isActive)}>{item.tooltip}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default FloatingDock;
