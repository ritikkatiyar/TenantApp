import { apiRequest } from '@/src/api/client';

export interface JoinCodeResultResponse {
  propertyId: string;
  propertyName: string;
  title: string;
  accessType: 'FULL_ACCESS' | 'CUSTOM_ACCESS';
  membershipId: string;
}

export function validateAndApplyJoinCode(token: string, code: string): Promise<JoinCodeResultResponse> {
  return apiRequest<JoinCodeResultResponse>(`/api/v1/properties/join-codes/validate`, {
    method: 'POST',
    body: JSON.stringify({ code }),
    token,
  });
}
