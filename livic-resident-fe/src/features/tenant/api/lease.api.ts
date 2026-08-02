import { apiRequest } from '@/src/api/client';

export interface CreateLeaseRequest {
  userId?: string | null;
  unitId: string;
  rentAmount?: number;
  securityDeposit: number;
  splitStrategy: 'FULL_UNIT' | 'PER_OCCUPANT' | 'CUSTOM';
  moveInDate: string;
  moveOutDate?: string | null;
  status?: 'ACTIVE' | 'ENDED';
  bookingId?: string | null;
}

export interface LeaseResponse {
  id: string;
  userId: string;
  unitId: string;
  unitNumber: string;
  rentAmount: number;
  securityDeposit: number;
  splitStrategy: string;
  moveInDate: string;
  moveOutDate?: string | null;
  status: string;
  tenantName?: string;
  tenantPhone?: string;
  propertyName?: string;
}

export function createLease(payload: CreateLeaseRequest, token: string): Promise<LeaseResponse> {
  return apiRequest<LeaseResponse>('/api/v1/finance/leases', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function terminateLease(leaseId: string, token: string): Promise<LeaseResponse> {
  return apiRequest<LeaseResponse>(`/api/v1/finance/leases/${leaseId}/terminate`, {
    method: 'PUT',
    token,
  });
}

export function getActiveLease(token: string): Promise<LeaseResponse | null> {
  return apiRequest<LeaseResponse | null>('/api/v1/finance/leases/tenant/active', {
    method: 'GET',
    token,
  });
}

export function listActiveLeasesByProperty(propertyId: string, token: string): Promise<LeaseResponse[]> {
  return apiRequest<LeaseResponse[]>(`/api/v1/finance/leases?propertyId=${propertyId}`, {
    method: 'GET',
    token,
  }).catch((err) => {
    console.warn('[Lease API] Failed to list active leases:', err.message);
    return [];
  });
}

