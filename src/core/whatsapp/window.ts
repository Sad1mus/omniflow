import { isWithin24HourWindow, getWindowEndTimestamp } from '../../lib/time';

/**
 * Verifica si podemos enviar mensajes gratuitos (dentro de ventana de 24h)
 * o si necesitamos usar plantillas (fuera de ventana)
 */
export function canSendMessage(
  lastInboundAt: Date,
  now: Date = new Date()
): { withinWindow: boolean; windowEnd: number } {
  const withinWindow = isWithin24HourWindow(lastInboundAt, now);
  const windowEnd = getWindowEndTimestamp(lastInboundAt);
  return { withinWindow, windowEnd };
}

/**
 * Calcula cuántos segundos quedan en la ventana de 24h
 */
export function secondsUntilWindowExpires(lastInboundAt: Date, now: Date = new Date()): number {
  const windowEnd = getWindowEndTimestamp(lastInboundAt);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  return Math.max(0, windowEnd - nowSeconds);
}

/**
 * Formatea tiempo restante de ventana
 */
export function formatWindowRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Determina si un mensaje debe ser rechazado por ventana cerrada
 */
export function shouldRejectOutsideWindow(
  lastInboundAt: Date,
  now: Date = new Date()
): boolean {
  return !isWithin24HourWindow(lastInboundAt, now);
}