/**
 * StatusBadge (StatusPill) — Badge / etiqueta de estado
 *
 * Usado en el Inbox para:
 * - Contadores de mensajes no leídos
 * - Estado "NUEVO"/"LEÍDO"
 * - Badges de proveedor (WhatsApp/Instagram)
 */

import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'unread'       // contador no leído (azul/cian)
  | 'new'          // etiqueta "NUEVO" verde
  | 'verified'     // check azul verificado
  | 'provider';    // badge de proveedor (violeta Instagram / cian WhatsApp)

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variants: Record<
  BadgeVariant,
  { bg: string; text: string; border: string; glow?: string }
> = {
  unread: {
    bg: 'bg-electric-cyan/20',
    text: 'text-electric-cyan',
    border: 'border-electric-cyan/30',
    glow: 'shadow-[0_0_12px_rgba(0,242,254,0.35)]',
  },
  new: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  verified: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  provider: {
    bg: 'bg-violet-500/20',
    text: 'text-violet-300',
    border: 'border-violet-500/30',
  },
};

const sizes: Record<NonNullable<StatusBadgeProps['size']>, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

export function StatusBadge({
  variant = 'unread',
  children,
  count,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const style = variants[variant];

  // Si hay count y no hay children explícitos, usamos el número
  const label = count !== undefined ? String(count) : children;

  const base =
    'inline-flex items-center justify-center gap-1 font-semibold rounded-full border backdrop-blur-md transition-all duration-200';

  return (
    <span
      className={cn(base, style.bg, style.text, style.border, style.glow, sizes[size], className)}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
