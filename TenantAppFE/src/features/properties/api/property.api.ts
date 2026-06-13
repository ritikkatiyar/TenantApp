import { apiRequest } from '@/src/api/client';
import type { CreatePropertyRequest, UpdatePropertyRequest, PropertyResponse } from '@/src/types/property';

type CreatePropertyParams = {
  ownerId: string;
  token: string;
  property: CreatePropertyRequest;
};

type UpdatePropertyParams = {
  propertyId: string;
  token: string;
  property: UpdatePropertyRequest;
};

export function createProperty(params: CreatePropertyParams): Promise<PropertyResponse> {
  const { ownerId, token, property } = params;

  return apiRequest<PropertyResponse>(`/api/v1/property/properties?ownerId=${ownerId}`, {
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
