import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import dayjs from 'dayjs';

/**
 * Formatea fecha en zona horaria del tenant
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  format = 'YYYY-MM-DD HH:mm'
): string {
  const zoned = utcToZonedTime(date, timezone);
  return dayjs(zoned).format(format);
}

/**
 * Parsea fecha desde string en zona horaria
 */
export function parseFromTimezone(
  dateStr: string,
  timezone: string,
  format = 'YYYY-MM-DD HH:mm'
): Date {
  return utcToZonedTime(new Date(dateStr), timezone);
}

/**
 * Verifica si estamos dentro de la ventana de 24 horas de Meta
 */
export function isWithin24HourWindow(lastInboundAt: Date, now = new Date()): boolean {
  const diffMs = now.getTime() - lastInboundAt.getTime();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return diffMs <= twentyFourHoursMs;
}

/**
 * Obtiene el timestamp de la ventana de 24 horas en segundos
 */
export function getWindowEndTimestamp(lastInboundAt: Date): number {
  return Math.floor(lastInboundAt.getTime() / 1000) + 24 * 60 * 60;
}

/**
 * Convierte timestamp de Meta a Date
 */
export function metaTimestampToDate(timestamp: string): Date {
  return new Date(Number(timestamp) * 1000);
}

/**
 * Genera timestamp para almacenar
 */
export function getCurrentTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}