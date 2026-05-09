import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { TokenBundle } from '../types/auth';

const AUTH_STORAGE_KEY = 'tenantapp.auth';

function canUseWebStorage(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

export async function readStoredAuth(): Promise<TokenBundle | null> {
  const rawValue = canUseWebStorage()
    ? window.localStorage.getItem(AUTH_STORAGE_KEY)
    : await SecureStore.getItemAsync(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as TokenBundle;
  } catch (_error) {
    await clearStoredAuth();
    return null;
  }
}

export async function writeStoredAuth(authData: TokenBundle): Promise<void> {
  const value = JSON.stringify(authData);

  if (canUseWebStorage()) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, value);
}

export async function clearStoredAuth(): Promise<void> {
  if (canUseWebStorage()) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
}
