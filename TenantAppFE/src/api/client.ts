import { apiUrl } from '../config/api';
import type { ApiResponse } from '../types/api';
import { ApiError } from '../utils/errors';

const DEFAULT_TIMEOUT_MS = 15000;

type ApiRequestOptions = RequestInit & {
  token?: string;
  timeout?: number;
};

/**
 * Generates a random UUID-like string for request correlation.
 */
function generateCorrelationId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as ApiResponse<T>;
  } catch (_error) {
    throw new Error('Server returned an invalid response.');
  }
}

export type AuthRefreshHandler = () => Promise<string | null>;

let authRefreshHandler: AuthRefreshHandler | null = null;

export function setAuthRefreshHandler(handler: AuthRefreshHandler) {
  authRefreshHandler = handler;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, timeout = DEFAULT_TIMEOUT_MS, ...requestOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const fetchOptions = {
      ...requestOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': generateCorrelationId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    let response = await fetch(apiUrl(path), fetchOptions);

    // Automatic Token Refresh Interceptor
    if (response.status === 401 && authRefreshHandler) {
      console.log(`[API] 401 Unauthorized for ${path}. Attempting token refresh...`);
      const newToken = await authRefreshHandler();
      
      if (newToken) {
        console.log('[API] Refresh successful. Retrying request...');
        // Update the token in headers and retry
        fetchOptions.headers = {
          ...fetchOptions.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(apiUrl(path), fetchOptions);
      }
    }

    const data = await parseResponse<T>(response);

    if (!response.ok || data?.success === false) {
      const message = (data as any)?.message || 
        (typeof data?.error === 'string' ? data.error : data?.error?.message) || 
        'Request failed.';
      const fieldErrors = (data as any)?.fieldErrors || (data?.error as any)?.fieldErrors;
      
      const logMessage = `[API ERROR] ${response.status} ${path} | ${message}`;
      const logData = { correlationId: fetchOptions.headers['X-Correlation-Id'] };
      
      if (response.status >= 400 && response.status < 500) {
        console.warn(logMessage, logData);
      } else {
        console.error(logMessage, logData);
      }

      throw new ApiError(message, response.status, fieldErrors);
    }

    return data?.data as T;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    
    if (!(error instanceof ApiError)) {
      console.error(`[API ERROR] Network/Unknown: ${path} | ${error.message}`);
    }
    
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
