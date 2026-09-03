import { apiRequest } from '@/src/api/client';

export interface MembershipResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  accessType?: 'FULL_ACCESS' | 'CUSTOM_ACCESS';
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
}

export interface TransferOwnershipRequest {
  toUserId: string;
}

export function getMemberships(token: string, propertyId: string): Promise<MembershipResponse[]> {
  return apiRequest<MembershipResponse[]>(`/api/v1/properties/${propertyId}/memberships`, {
    method: 'GET',
    token,
  });
}

export function assignRole(token: string, propertyId: string, data: AssignRoleRequest): Promise<MembershipResponse> {
  return apiRequest<MembershipResponse>(`/api/v1/properties/${propertyId}/memberships`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export function removeRole(token: string, propertyId: string, membershipId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/properties/${propertyId}/memberships/${membershipId}`, {
    method: 'DELETE',
    token,
  });
}

export function transferOwnership(token: string, propertyId: string, data: TransferOwnershipRequest): Promise<void> {
  return apiRequest<void>(`/api/v1/properties/${propertyId}/memberships/transfer-ownership`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}
