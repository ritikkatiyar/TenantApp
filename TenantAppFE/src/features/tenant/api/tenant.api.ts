import { apiRequest } from '@/src/api/client';

export interface TenantProfile {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface UpdateTenantProfileRequest {
  phone?: string;
}

export function getTenantProfile(token: string): Promise<TenantProfile | null> {
  return apiRequest<TenantProfile>('/api/v1/user/tenant/profile', {
    method: 'GET',
    token,
  }).catch((err) => {
    console.warn('[Tenant Profile API] Failed to fetch profile:', err?.message);
    return null;
  });
}

export function updateTenantProfile(token: string, data: UpdateTenantProfileRequest): Promise<TenantProfile> {
  return apiRequest<TenantProfile>('/api/v1/user/tenant/profile', {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  });
}
