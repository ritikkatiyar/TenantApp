import { apiRequest } from '@/src/api/client';

export interface UserPreference {
  onboardingDone: boolean;
  activeMode: string | null;
}

export const getPreference = async (token: string): Promise<UserPreference> => {
  return apiRequest<UserPreference>('/api/v1/users/preference', {
    method: 'GET',
    token,
  });
};

export const savePreference = async (token: string, activeMode: string): Promise<void> => {
  return apiRequest<void>('/api/v1/users/preference', {
    method: 'POST',
    token,
    body: JSON.stringify({ activeMode }),
  });
};
