import { apiRequest } from '@/src/api/client';
import type { PropertyResponse } from '@/src/types/property';

export function getMyProperties(token: string): Promise<PropertyResponse[]> {
  return apiRequest<PropertyResponse[]>(`/api/v1/property/properties`, {
    method: 'GET',
    token,
  });
}
