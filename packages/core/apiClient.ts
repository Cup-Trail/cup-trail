import {
  apiPatch,
  apiPost,
  apiPut,
  type ApiResponse,
  getEnv,
  supabase,
} from '@cuptrail/utils';

import type { Result } from './types/types';

const { supabaseUrl, supabaseAnonKey } = getEnv();
const API_BASE = `${supabaseUrl}/functions/v1/api`;

const apiUrl = (path: string) => `${API_BASE}${path}`;

/**
 * Build headers carrying the current user's access token so the `api` edge
 * function can identify the caller. Returns null when there is no session.
 */
async function authedHeaders(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey };
}

function toResult<T>(res: ApiResponse<T>): Result<T> {
  if (res.ok && res.data !== undefined) {
    return { success: true, data: res.data };
  }
  return {
    success: false,
    source: 'supabase',
    message: res.error ?? `HTTP ${res.status}`,
  };
}

const NOT_SIGNED_IN: Result<never> = {
  success: false,
  source: 'client',
  message: 'You must be signed in to do that.',
};

export async function apiWritePost<T>(
  path: string,
  body: unknown
): Promise<Result<T>> {
  const headers = await authedHeaders();
  if (!headers) return NOT_SIGNED_IN;
  return toResult(
    await apiPost<T>(apiUrl(path), body, {
      skipAuth: true,
      customHeaders: headers,
    })
  );
}

export async function apiWritePatch<T>(
  path: string,
  body: unknown
): Promise<Result<T>> {
  const headers = await authedHeaders();
  if (!headers) return NOT_SIGNED_IN;
  return toResult(
    await apiPatch<T>(apiUrl(path), body, {
      skipAuth: true,
      customHeaders: headers,
    })
  );
}

export async function apiWritePut<T>(
  path: string,
  body: unknown
): Promise<Result<T>> {
  const headers = await authedHeaders();
  if (!headers) return NOT_SIGNED_IN;
  return toResult(
    await apiPut<T>(apiUrl(path), body, {
      skipAuth: true,
      customHeaders: headers,
    })
  );
}
