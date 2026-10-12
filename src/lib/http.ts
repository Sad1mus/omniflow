import type { IncomingMessage } from 'http';
import crypto from 'crypto';

/**
 * HTTP client con reintento y timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Reintentar solo en errores de red o 5xx
    if (!response.ok && response.status >= 500 && retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return fetchWithRetry(url, options, retries - 1, timeoutMs);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Middleware para rate limiting en Express
 */
export function createRateLimiter(maxPerWindow: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetTime: number }>();

  return function rateLimiter(req: any, res: any, next: () => void) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = hits.get(ip);

    if (!record || now > record.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxPerWindow) {
      res.status(429).send({ error: 'Rate limit exceeded' });
      return;
    }

    record.count++;
    next();
  };
}

/**
 * Valida firma de webhook de Meta
 */
export function verifyMetaSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature.startsWith('sha256=')) return false;
  const receivedHash = signature.substring(7);
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')
    .digest('hex');
  return receivedHash === expectedHash;
}

/**
 * Parsea user agent para bots
 */
export function isLikelyBot(userAgent: string): boolean {
  const botPatterns = [
    /googlebot/i,
    /facebookexternalhit/i,
    /whatsapp/i,
    /telegrambot/i,
    /slackbot/i,
    /discordbot/i,
    /curl/i,
    /python-requests/i,
  ];
  return botPatterns.some((pattern) => pattern.test(userAgent));
}