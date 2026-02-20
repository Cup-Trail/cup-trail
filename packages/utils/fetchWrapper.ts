import { getEnv } from './env';

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  customHeaders?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

/**
 * Reusable fetch wrapper with built-in authentication and CORS headers
 * @param url - The URL to fetch from
 * @param options - Fetch options including custom headers and auth settings
 * @returns Promise with standardized API response
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { supabaseAnonKey } = getEnv();

  const {
    skipAuth = false,
    customHeaders = {},
    headers = {},
    ...fetchOptions
  } = options;

  // Default headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if not skipped
  if (!skipAuth && supabaseAnonKey) {
    defaultHeaders['Authorization'] = `Bearer ${supabaseAnonKey}`;
  }

  // Merge headers: default -> custom -> user-provided
  const finalHeaders = {
    ...defaultHeaders,
    ...customHeaders,
    ...headers,
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: finalHeaders,
    });

    const responseData: ApiResponse<T> = {
      status: response.status,
      ok: response.ok,
    };

    if (response.ok) {
      try {
        const data = await response.json();
        responseData.data = data as T;
      } catch {
        // If response is not JSON, try to get text
        const text = await response.text();
        responseData.data = text as T;
      }
    } else {
      try {
        const errorData = (await response.json()) as {
          error?: string;
          message?: string;
        };
        responseData.error =
          errorData.error || errorData.message || `HTTP ${response.status}`;
      } catch {
        responseData.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    }

    return responseData;
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Convenience method for GET requests
 */
export async function apiGet<T = unknown>(
  url: string,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { ...options, method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost<T = unknown>(
  url: string,
  body?: unknown,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut<T = unknown>(
  url: string,
  body?: unknown,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete<T = unknown>(
  url: string,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' });
}

/**
 * Convenience method for PATCH requests
 */
export async function apiPatch<T = unknown>(
  url: string,
  body?: unknown,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}
