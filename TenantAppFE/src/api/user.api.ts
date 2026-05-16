import { apiRequest } from './client';

export interface UserSearchResponse {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  globalRole: string;
}

export function searchUserByPhone(phone: string, token: string): Promise<UserSearchResponse | null> {
  return apiRequest<UserSearchResponse | null>(`/api/v1/user/search?phone=${encodeURIComponent(phone)}`, {
    method: 'GET',
    token,
  });
}
