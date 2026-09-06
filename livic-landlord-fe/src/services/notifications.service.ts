import { Platform } from 'react-native';
import { apiRequest } from '../api/client';

export type DevicePlatform = 'ANDROID' | 'IOS' | 'WEB';

export interface RegisterDeviceTokenPayload {
  expoPushToken: string;
  platform: DevicePlatform;
}

/**
 * Safely resolves an Expo Push Token if on a native device and permissions are granted.
 * Returns null on Web or when permissions are rejected.
 */
export async function getExpoPushTokenSafely(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    // Dynamic import to prevent bundler errors on environments without expo-notifications
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData?.data || null;
  } catch (_e) {
    return null;
  }
}

/**
 * Registers an Expo push token with the backend device registry.
 */
export async function registerDeviceToken(
  authToken: string,
  expoPushToken: string
): Promise<void> {
  if (!expoPushToken || !authToken) return;

  const platform: DevicePlatform =
    Platform.OS === 'ios'
      ? 'IOS'
      : Platform.OS === 'android'
      ? 'ANDROID'
      : 'WEB';

  try {
    await apiRequest<void>('/api/v1/me/device-token', {
      method: 'POST',
      token: authToken,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expoPushToken,
        platform,
      }),
    });
  } catch (error) {
    // Non-blocking warning so app startup is never interrupted
    console.warn('[NotificationService] Failed to register device push token:', error);
  }
}

/**
 * Convenience orchestrator to detect device push token and register with backend.
 */
export async function initPushNotifications(authToken: string): Promise<void> {
  try {
    const token = await getExpoPushTokenSafely();
    if (token) {
      await registerDeviceToken(authToken, token);
    }
  } catch (error) {
    console.warn('[NotificationService] Error initializing push notifications:', error);
  }
}
