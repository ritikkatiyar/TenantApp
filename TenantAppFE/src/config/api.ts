import { Platform } from 'react-native';

const DEFAULT_PORT = '8080';

function getDefaultBaseUrl(): string {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl();
console.log('[API] Using Base URL:', API_BASE_URL);

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
