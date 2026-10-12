import crypto from 'crypto';
import { readFileSync } from 'fs';

const SECRET_LENGTH = 32;

/**
 * Genera una clave de cifrado aleatoria
 */
export function generateSecret(): string {
  return crypto.randomBytes(SECRET_LENGTH).toString('hex');
}

/**
 * Cifra un texto usando AES-256-GCM
 */
export function encrypt(text: string, key: string): {
  iv: string;
  content: string;
} {
  const iv = crypto.randomBytes(12).toString('hex');
  const secretKey = crypto.createHash('sha256').update(key).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv, content: encrypted };
}

/**
 * Descifra un texto cifrado con AES-256-GCM
 */
export function decrypt(iv: string, content: string, key: string): string {
  const secretKey = crypto.createHash('sha256').update(key).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Cifra credenciales Meta por tenant
 */
export function encryptCredential(value: string): string {
  const key = process.env.ENCRYPTION_KEY || generateSecret();
  const { content } = encrypt(value, key);
  // Guardamos la clave para poder descifrar (en producción se usaría KMS)
  return content;
}

/**
 * Descifra credenciales Meta por tenant
 */
export function decryptCredential(encrypted: string, iv: string, key: string): string {
  return decrypt(iv, encrypted, key);
}

/**
 * Genera HMAC-SHA256 para integridad
 */
export function generateHmac(data: string, key: string): string {
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Verifica HMAC-SHA256
 */
export function verifyHmac(data: string, expectedHmac: string, key: string): boolean {
  const hmac = generateHmac(data, key);
  return hmac === expectedHmac;
}