import { apiRequest } from '@/src/api/client';

export interface MembershipResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  roleCode: string;
  roleName: string;
}

export interface AssignRoleRequest {
  userId: string;
  roleCode: string;
}

export interface TransferOwnershipRequest {
  toUserId: string;
}

export function getMemberships(token: string, propertyId: string): Promise<MembershipResponse[]> {
  return apiRequest<MembershipResponse[]>(`/api/v1/property/properties/${propertyId}/memberships`, {
    method: 'GET',
    token,
  });
}

export function assignRole(token: string, propertyId: string, data: AssignRoleRequest): Promise<MembershipResponse> {
  return apiRequest<MembershipResponse>(`/api/v1/property/properties/${propertyId}/memberships`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export function removeRole(token: string, propertyId: string, membershipId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/property/properties/${propertyId}/memberships/${membershipId}`, {
    method: 'DELETE',
    token,
  });
}

export function transferOwnership(token: string, propertyId: string, data: TransferOwnershipRequest): Promise<void> {
  return apiRequest<void>(`/api/v1/property/properties/${propertyId}/memberships/transfer-ownership`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}
