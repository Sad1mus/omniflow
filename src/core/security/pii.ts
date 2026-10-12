/**
 * Detección y sanitización de PII (Información Personal Identificable)
 */

const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
  dni: /\b\d{7,8}[A-Z]?\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  // Patrones específicos por país si necesario
};

/**
 * Redacta PII en texto
 */
export function redactPII(text: string, placeholder = '[REDACTED]'): string {
  let result = text;

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    result = result.replace(pattern, placeholder);
  }

  return result;
}

/**
 * Redacta PII en objeto recursivamente
 */
export function redactPIIInObject(obj: any, placeholder = '[REDACTED]'): any {
  if (typeof obj === 'string') {
    return redactPII(obj, placeholder);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactPIIInObject(item, placeholder));
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // No redactar campos que sabemos que son seguros
      if (isSafeKey(key)) {
        result[key] = value;
      } else {
        result[key] = redactPIIInObject(value, placeholder);
      }
    }
    return result;
  }

  return obj;
}

function isSafeKey(key: string): boolean {
  const safeKeys = ['id', 'created_at', 'updated_at', 'status', 'type', 'role'];
  return safeKeys.includes(key.toLowerCase());
}

/**
 * Valida si un texto contiene PII
 */
export function containsPII(text: string): boolean {
  for (const pattern of Object.values(PII_PATTERNS)) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}