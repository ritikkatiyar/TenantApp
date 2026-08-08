import { apiRequest } from '@/src/api/client';
import type { PropertyResponse } from '@/src/types/property';

export interface PropertyListResponse {
  content: PropertyResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getMyProperties(token: string): Promise<PropertyResponse[]> {
  const response = await apiRequest<PropertyListResponse>(`/api/v1/properties?size=2000`, {
    method: 'GET',
    token,
  });
  return response?.content || [];
}
