import { apiUrl } from '../config/api';
import type { ApiResponse } from '../types/api';

type ApiRequestOptions = RequestInit & {
  token?: string;
};

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

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const response = await fetch(apiUrl(path), {
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await parseResponse<T>(response);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error?.message || data?.message || 'Request failed.');
  }

  return data?.data as T;
}
