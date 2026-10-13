/**
 * Utilidades compartidas del frontend
 */

/**
 * Une clases de Tailwind, omitiendo falsy/null/undefined.
 * Versión ligera sin dependencias (reemplaza a clsx/tailwind-merge).
 */
export function cn(...classes: (string | null | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}
