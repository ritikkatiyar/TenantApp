import { apiRequest } from './client';
import type { PropertyResponse } from '../types/property';

export function getPropertiesByUser(userId: string, token: string): Promise<PropertyResponse[]> {
  return apiRequest<PropertyResponse[]>(`/api/v1/property/roles/users/${userId}/properties`, {
    method: 'GET',
    token,
  });
}
