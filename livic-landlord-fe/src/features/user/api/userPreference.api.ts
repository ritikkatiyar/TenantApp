import { apiRequest } from '@/src/api/client';

export type UserActiveMode = 'RENTAL' | 'RESIDENTIAL';

export interface SaveUserPreferenceRequest {
  activeMode: UserActiveMode;
  onboardingDone: boolean;
}

export interface UserPreferenceResponse {
  userId: string;
  activeMode: UserActiveMode;
  onboardingDone: boolean;
}

export async function getUserPreference(token: string): Promise<UserPreferenceResponse> {
  return apiRequest<UserPreferenceResponse>('/api/v1/user/preference', {
    method: 'GET',
    token
  });
}

export async function saveUserPreference(request: SaveUserPreferenceRequest, token: string): Promise<UserPreferenceResponse> {
  return apiRequest<UserPreferenceResponse>('/api/v1/user/preference', {
    method: 'POST',
    body: JSON.stringify(request),
    token
  });
}
