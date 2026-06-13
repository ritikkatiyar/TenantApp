import { apiRequest } from '@/src/api/client';
import type { PropertyResponse } from '@/src/types/property';

export function getPropertiesByUser(userId: string, token: string): Promise<PropertyResponse[]> {
  return apiRequest<PropertyResponse[]>(`/api/v1/property/roles/users/${userId}/properties`, {
    method: 'GET',
    token,
  });
}
