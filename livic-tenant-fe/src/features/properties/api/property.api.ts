import { apiRequest } from '@/src/api/client';
import type { CreatePropertyRequest, UpdatePropertyRequest, PropertyResponse } from '@/src/types/property';

type CreatePropertyParams = {
  token: string;
  property: CreatePropertyRequest;
};

type UpdatePropertyParams = {
  propertyId: string;
  token: string;
  property: UpdatePropertyRequest;
};

export function createProperty(params: CreatePropertyParams): Promise<PropertyResponse> {
  const { token, property } = params;

  return apiRequest<PropertyResponse>(`/api/v1/property/properties`, {
    method: 'POST',
    token,
    body: JSON.stringify(property),
  });
}

export function updateProperty(params: UpdatePropertyParams): Promise<PropertyResponse> {
  const { propertyId, token, property } = params;

  return apiRequest<PropertyResponse>(`/api/v1/property/properties/${propertyId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(property),
  });
}

export function getProperty(propertyId: string, token: string): Promise<PropertyResponse> {
  return apiRequest<PropertyResponse>(`/api/v1/property/properties/${propertyId}`, {
    method: 'GET',
    token,
  });
}

export function deletePropertyApi(propertyId: string, token: string): Promise<void> {
  return apiRequest<void>(`/api/v1/property/properties/${propertyId}`, {
    method: 'DELETE',
    token,
  });
}

export function togglePropertyActiveApi(propertyId: string, active: boolean, token: string): Promise<PropertyResponse> {
  return apiRequest<PropertyResponse>(`/api/v1/property/properties/${propertyId}/toggle-active?active=${active}`, {
    method: 'POST',
    token,
  });
}
