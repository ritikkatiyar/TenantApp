import { apiRequest } from './client';
import type { CreatePropertyRequest, PropertyResponse } from '../types/property';

type CreatePropertyParams = {
  ownerId: string;
  token: string;
  property: CreatePropertyRequest;
};

export function createProperty(params: CreatePropertyParams): Promise<PropertyResponse> {
  const { ownerId, token, property } = params;

  return apiRequest<PropertyResponse>(`/api/v1/properties?ownerId=${ownerId}`, {
    method: 'POST',
    token,
    body: JSON.stringify(property),
  });
}
