import { apiRequest } from '@/src/api/client';

export interface RoleResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  roleRank: number;
  isActive: boolean;
  permissionCodes: string[];
  propertyId?: string | null;
}


export interface JoinCodeResponse {
  id: string;
  code: string;
  roleCode: string;
  roleName: string;
  maxUses: number;
  usesCount: number;
  isActive: boolean;
  expiresAt: string;
}

export interface JoinCodeResultResponse {
  propertyId: string;
  propertyName: string;
  roleCode: string;
  membershipId: string;
}

export function getPropertyRoles(token: string, propertyId: string): Promise<RoleResponse[]> {
  return apiRequest<RoleResponse[]>(`/api/v1/properties/${propertyId}/roles`, {
    method: 'GET',
    token,
  });
}

export function toggleRoleActive(token: string, propertyId: string, roleCode: string, active: boolean): Promise<void> {
  return apiRequest<void>(`/api/v1/properties/${propertyId}/roles/${roleCode}/toggle-active?active=${active}`, {
    method: 'POST',
    token,
  });
}

export function updateRolePermissions(token: string, propertyId: string, roleCode: string, permissionCodes: string[]): Promise<void> {
  return apiRequest<void>(`/api/v1/properties/${propertyId}/roles/${roleCode}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permissionCodes }),
    token,
  });
}

export function createCustomRole(token: string, propertyId: string, data: { name: string; code?: string; description?: string; permissionCodes?: string[] }): Promise<RoleResponse> {
  return apiRequest<RoleResponse>(`/api/v1/properties/${propertyId}/roles/custom`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export function generateJoinCode(token: string, propertyId: string, roleCode: string, maxUses: number): Promise<JoinCodeResponse> {
  return apiRequest<JoinCodeResponse>(`/api/v1/properties/${propertyId}/join-codes`, {
    method: 'POST',
    body: JSON.stringify({ roleCode, maxUses }),
    token,
  });
}

export function getPropertyJoinCodes(token: string, propertyId: string): Promise<JoinCodeResponse[]> {
  return apiRequest<JoinCodeResponse[]>(`/api/v1/properties/${propertyId}/join-codes`, {
    method: 'GET',
    token,
  });
}

export function validateAndApplyJoinCode(token: string, code: string): Promise<JoinCodeResultResponse> {
  return apiRequest<JoinCodeResultResponse>(`/api/v1/properties/join-codes/validate`, {
    method: 'POST',
    body: JSON.stringify({ code }),
    token,
  });
}
