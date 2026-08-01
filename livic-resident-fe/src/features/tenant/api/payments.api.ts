import { apiRequest } from '@/src/api/client';
import { apiUrl } from '@/src/config/api';

export interface RentCycle {
  id: string;
  leaseId: string;
  billingMonth: string;
  rentAmount: number;
  utilityAmount: number;
  totalAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PUBLISHED' | 'PAID' | 'OVERDUE';
  paidAt?: string | null;
}

export function getTenantRentCycles(token: string, leaseId?: string): Promise<RentCycle[]> {
  const query = leaseId ? `?leaseId=${leaseId}` : '';
  return apiRequest<any>(`/api/v1/finance/rent-cycles${query}`, {
    method: 'GET',
    token,
  }).then((res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  }).catch((err) => {
    console.warn('[Payments API] Failed to load rent cycles:', err?.message);
    return [];
  });
}

export function markRentCyclePaid(token: string, cycleId: string): Promise<RentCycle> {
  return apiRequest<RentCycle>(`/api/v1/finance/rent-cycles/${cycleId}/mark-paid`, {
    method: 'POST',
    token,
  });
}

export function getStatementUrl(cycleId: string, token: string): string {
  return apiUrl(`/api/v1/finance/rent-cycles/${cycleId}/invoice?token=${token}`);
}
