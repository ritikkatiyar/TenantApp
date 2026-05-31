import { Platform } from 'react-native';

const DEFAULT_PORT = '8080';
const DEFAULT_AI_PORT = '8081';

function getDefaultBaseUrl(port: string): string {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}`;
  }
  return `http://localhost:${port}`;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl(DEFAULT_PORT);
export const AI_API_BASE_URL = process.env.EXPO_PUBLIC_AI_API_URL || getDefaultBaseUrl(DEFAULT_AI_PORT);

console.log('[API] Using Base URL:', API_BASE_URL);
console.log('[API] Using AI Base URL:', AI_API_BASE_URL);

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function aiApiUrl(path: string): string {
  return `${AI_API_BASE_URL}${path}`;
}
