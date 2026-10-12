import { logger } from '../lib/logger.js';
import { clinicVertical } from './clinic/index.js';
import { realEstateVertical } from './real-estate/index.js';
import type { VerticalDefinition } from './types.js';

const log = logger.child({ module: 'vertical-registry' });
const registry = new Map<string, VerticalDefinition>();

export function registerVertical(vertical: VerticalDefinition): void {
  if (registry.has(vertical.id)) {
    log.warn({ verticalId: vertical.id }, 'vertical already registered, overwriting');
  }
  registry.set(vertical.id, vertical);
  log.info({ verticalId: vertical.id, name: vertical.name }, 'vertical registered');
}

export function getVertical(id: string): VerticalDefinition | null {
  return registry.get(id) ?? null;
}

export function listVerticals(): VerticalDefinition[] {
  return Array.from(registry.values());
}

// Registro inicial de verticales soportadas
registerVertical(clinicVertical);
registerVertical(realEstateVertical);

log.info({ count: registry.size }, 'vertical registry initialized');