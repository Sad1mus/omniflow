/**
 * Redacta tokens y secretos de objetos de log
 */
export function redactLog(obj: unknown): unknown {
  const secrets = [
    'access_token',
    'token',
    'api_key',
    'secret',
    'password',
    'encryption_key',
    'service_role_key',
    'app_secret',
    'verify_token',
    'openrouter_api_key',
    'meta_app_secret',
  ];

  return redact(obj, secrets, '__redacted__');
}

function redact(
  value: unknown,
  keys: readonly string[],
  placeholder: string,
  seen = new WeakSet<object>()
): unknown {
  if (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return placeholder;
    seen.add(value);
  }

  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, keys, placeholder, seen));
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    const keysToRedact = Object.keys(value).filter((k) =>
      keys.some((secretKey) => k.toLowerCase().includes(secretKey.toLowerCase()))
    );

    for (const key of Object.keys(value)) {
      if (keysToRedact.includes(key)) {
        result[key] = placeholder;
      } else {
        result[key] = redact((value as Record<string, unknown>)[key], keys, placeholder, seen);
      }
    }
    return result;
  }

  return value;
}

/**
 * Crea logger que redacta automáticamente
 */
export function createRedactingLogger(logger: any) {
  const original = logger.error.bind(logger);
  logger.error = (...args: unknown[]) => original(...args.map(redactLog));
  return logger;
}