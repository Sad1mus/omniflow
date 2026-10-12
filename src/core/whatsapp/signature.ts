import crypto from 'crypto';

import { logger } from '../../lib/logger';

/**
 * Verifica la firma HMAC-SHA256 de un webhook de Meta
 * @param payload El cuerpo raw del payload
 * @param signature El valor de la cabecera X-Hub-Signature-256
 * @param appSecret El Meta App Secret
 * @returns true si la firma es válida
 */
export function verifyMetaSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature.startsWith('sha256=')) {
    logger.warn('Invalid signature format - missing sha256 prefix');
    return false;
  }

  const receivedHash = signature.substring(7);
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
}

/**
 * Verifica el challenge GET de Meta para suscripción del webhook.
 *
 * FIX: antes comparaba verifyToken consigo mismo (siempre true).
 * Ahora compara correctamente el token recibido con el esperado.
 */
export function verifySubscriptionChallenge(
  mode: string | undefined,
  token: string | undefined,
  challenge: string | undefined,
  expectedVerifyToken: string
): { valid: boolean; challenge?: string } {
  if (mode !== 'subscribe') {
    return { valid: false };
  }

  // FIX: comparar token recibido con expectedVerifyToken, NO consigo mismo
  if (!token || token !== expectedVerifyToken) {
    return { valid: false };
  }

  if (!challenge) {
    return { valid: false };
  }

  return { valid: true, challenge };
}