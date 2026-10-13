/**
 * OmniFlow CRM — Frontend API Client
 *
 * Wrapper around fetch() that injects the Bearer token from localStorage
 * and normalizes errors. Used by all dashboard views.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
  error: string;
  status: number;
}

export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('omniflow_token')
      : null;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw {
      error: body.error || `API Error: ${res.status}`,
      status: res.status,
    } as ApiError;
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/**
 * Helper to set/clear the auth token in localStorage.
 */
export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('omniflow_token', token);
  } else {
    localStorage.removeItem('omniflow_token');
  }
}