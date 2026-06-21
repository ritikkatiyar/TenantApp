import { apiRequest } from '@/src/api/client';

export interface OnboardingPreference {
  onboardingDone: boolean;
  activeMode: string | null;
}

export const getPreference = async (token: string): Promise<OnboardingPreference> => {
  return apiRequest<OnboardingPreference>('/api/v1/onboarding/preference', {
    method: 'GET',
    token,
  });
};

export const savePreference = async (token: string, activeMode: string): Promise<void> => {
  return apiRequest<void>('/api/v1/onboarding/preference', {
    method: 'POST',
    token,
    body: JSON.stringify({ activeMode }),
  });
};
