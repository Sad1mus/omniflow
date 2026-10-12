import { fetchWithRetry } from '../../lib/http';
import { logger } from '../../lib/logger';
import { ProviderError } from '../../lib/errors';

/**
 * Cliente HTTP para Meta Graph API
 */
export class MetaGraphClient {
  private readonly apiVersion = 'v21.0';
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  /**
   * Realiza una petición GET a Meta Graph API
   */
  async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);
    url.search = new URLSearchParams(params).toString();

    const response = await fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new ProviderError(
        `Meta API GET ${path} failed: ${response.status} ${errorBody}`,
        'meta',
        response.status
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Realiza una petición POST a Meta Graph API
   */
  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/${path}`;
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new ProviderError(
        `Meta API POST ${path} failed: ${response.status} ${errorBody}`,
        'meta',
        response.status
      );
    }

    return response.json() as Promise<T>;
  }
}

export const metaClient = new MetaGraphClient();