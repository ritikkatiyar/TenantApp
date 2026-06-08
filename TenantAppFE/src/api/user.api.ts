import { apiRequest } from './client';

export interface UserSearchResponse {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  globalRole: string;
}

export function searchUserByPhone(phone: string, token: string): Promise<UserSearchResponse[]> {
  return apiRequest<UserSearchResponse[]>(`/api/v1/user/search?phone=${encodeURIComponent(phone)}`, {
    method: 'GET',
    token,
  });
}

export function quickCreateTenant(
  payload: { email: string; fullName: string; phoneNumber: string },
  token: string
): Promise<UserSearchResponse> {
  return apiRequest<UserSearchResponse>('/api/v1/user/create-tenant', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
