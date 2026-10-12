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
 * Verifica el webhook GET (desafío de suscripción de Meta)
 * @param mode El modo hub.mode
 * @param challenge El challenge de Meta
 * @param verifyToken El token de verificación configurado
 * @returns El challenge si es válido
 */
export function verifySubscriptionChallenge(
  mode: string,
  challenge: string,
  verifyToken: string
): string {
  if (mode !== 'subscribe') {
    throw new Error(`Hub mode mismatch: ${mode}`);
  }
  if (verifyToken !== verifyToken) {
    throw new Error(`Verification token mismatch`);
  }
  if (!challenge) {
    throw new Error('Challenge is required');
  }
  return challenge;
}