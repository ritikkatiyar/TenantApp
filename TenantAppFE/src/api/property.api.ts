import { apiRequest } from './client';
import type { CreatePropertyRequest, UpdatePropertyRequest, PropertyResponse } from '../types/property';

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

  return apiRequest<PropertyResponse>(`/api/v1/properties?ownerId=${ownerId}`, {
    method: 'POST',
    token,
    body: JSON.stringify(property),
  });
}

export function updateProperty(params: UpdatePropertyParams): Promise<PropertyResponse> {
  const { propertyId, token, property } = params;

  return apiRequest<PropertyResponse>(`/api/v1/properties/${propertyId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(property),
  });
}

export function getProperty(propertyId: string, token: string): Promise<PropertyResponse> {
  return apiRequest<PropertyResponse>(`/api/v1/properties/${propertyId}`, {
    method: 'GET',
    token,
  });
}
