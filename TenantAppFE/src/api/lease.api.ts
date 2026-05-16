import { apiRequest } from './client';

export interface CreateLeaseRequest {
  userId: string;
  unitId: string;
  rentAmount: number;
  securityDeposit: number;
  splitStrategy: 'FULL_UNIT' | 'PER_OCCUPANT' | 'CUSTOM';
  moveInDate: string;
  moveOutDate?: string | null;
  status?: 'ACTIVE' | 'ENDED';
}

export interface LeaseResponse {
  id: string;
  userId: string;
  unitId: string;
  rentAmount: number;
  securityDeposit: number;
  splitStrategy: string;
  moveInDate: string;
  moveOutDate?: string | null;
  status: string;
}

export function createLease(payload: CreateLeaseRequest, token: string): Promise<LeaseResponse> {
  return apiRequest<LeaseResponse>('/api/v1/finance/leases', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
