import { logger } from '../../lib/logger.js';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

const log = logger.child({ module: 'meta-conversions' });

export interface ConversionEvent {
  eventName: 'Lead' | 'CompleteRegistration' | 'Purchase';
  eventTime: number;
  currency?: string;
  value?: number;
  userData: {
    em?: string; // Hashed email (SHA256)
    ph?: string; // Hashed phone (E.164 format)
  };
  customData?: Record<string, unknown>;
}

/**
 * Hash sensitive user data for Meta Conversions API compliance
 * @param data Input string to hash
 * @returns Hex-encoded SHA256 hash
 */
function hashData(data: string): string {
  return crypto.createHash('sha256')
    .update(data.trim().toLowerCase())
    .digest('hex');
}

/**
 * Sends a conversion event to Meta Conversions API
 * @param event Event data to send
 */
export async function sendConversionEvent(event: ConversionEvent): Promise<void> {
  // Skip if required configuration is missing (safe for dev/staging)
  if (!env.META_PIXEL_ID || !env.META_CONVERSIONS_TOKEN) {
    log.debug('Meta Conversions API not configured, skipping event');
    return;
  }

  try {
    const payload = {
      data: [
        {
          event_name: event.eventName,
          event_time: event.eventTime,
          action_source: 'other',
          user_data: {
            em: event.userData.em ? [hashData(event.userData.em)] : undefined,
            ph: event.userData.ph ? [hashData(event.userData.ph.replace(/\D/g, ''))] : undefined,
          },
          custom_data: event.customData,
        },
      ],
      test_event_code: env.META_TEST_EVENT_CODE || undefined,
    };

    const url = `https://graph.facebook.com/v20.0/${env.META_PIXEL_ID}/events?access_token=${env.META_CONVERSIONS_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error({
        status: response.status,
        error: errorText,
        eventName: event.eventName
      }, 'Meta Conversions API failed');
    } else {
      log.info({ eventName: event.eventName }, 'Conversion event sent to Meta');
    }
  } catch (error) {
    log.error({ error }, 'Failed to send conversion event');
  }
}