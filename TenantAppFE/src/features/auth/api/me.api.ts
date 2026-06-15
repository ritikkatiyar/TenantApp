import { apiRequest } from '@/src/api/client';

export interface MembershipSummary {
  propertyId: string;
  propertyName: string;
  membershipRoleCode: string;
}

export interface ActiveLeaseSummary {
  leaseId: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  rentAmount: number;
  status: string;
}

export interface MyContextResponse {
  globalRole: string;
  memberships: MembershipSummary[];
  activeLeases: ActiveLeaseSummary[];
}

export function getMyContext(token: string): Promise<MyContextResponse> {
  return apiRequest<MyContextResponse>('/api/v1/user/me/context', {
    method: 'GET',
    token,
  });
}
