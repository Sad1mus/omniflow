/**
 * GlassCard — Componente base de Glassmorphism (niveles de elevación)
 *
 * Niveles de elevación (blur):
 * - level 1: backdrop-blur-16 (superficies secundarias)
 * - level 2: backdrop-blur-24 (tarjetas principales)
 * - level 3: backdrop-blur-32 (botones flotantes, overlays)
 */

import React from 'react';

type GlassLevel = 1 | 2 | 3;

interface GlassCardProps {
  children: React.ReactNode;
  level?: GlassLevel;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'md' | 'lg' | 'xl';
}

const blurLevels: Record<GlassLevel, string> = {
  1: 'backdrop-blur-16',
  2: 'backdrop-blur-24',
  3: 'backdrop-blur-32',
};

const paddings: Record<NonNullable<GlassCardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const roundings: Record<NonNullable<GlassCardProps['rounded']>, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

export function GlassCard({
  children,
  level = 2,
  className = '',
  padding = 'md',
  rounded = 'lg',
}: GlassCardProps) {
  return (
    <div
      className={`
        ${blurLevels[level]}
        ${paddings[padding]}
        ${roundings[rounded]}
        bg-white/8 dark:bg-white/5
        border border-white/10 dark:border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}

export default GlassCard;