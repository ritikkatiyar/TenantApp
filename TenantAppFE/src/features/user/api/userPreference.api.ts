import { apiRequest } from '@/src/api/client';

export interface SaveUserPreferenceRequest {
  activeMode: 'RENTAL' | 'HOSTEL' | 'MESS' | 'SOCIETY';
  onboardingDone: boolean;
}

export interface UserPreferenceResponse {
  userId: string;
  activeMode: 'RENTAL' | 'HOSTEL' | 'MESS' | 'SOCIETY';
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
