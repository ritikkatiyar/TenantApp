import { apiRequest } from '@/src/api/client';

export interface ChargeResponse {
  id: string;
  chargeType: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface RentCycleResponse {
  id: string;
  leaseId: string;
  billingMonth: string;
  totalAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PUBLISHED' | 'PAID' | 'OVERDUE';
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  charges: ChargeResponse[];
}

export interface PreFlightChecklistResponse {
  totalUnits: number;
  activeLeases: number;
  meterReadingsExpected: number;
  meterReadingsEntered: number;
  isReady: boolean;
}

export const batchGenerateRentCycle = async (
  propertyId: string,
  billingMonth: string,
  dueDate: string,
  token: string
): Promise<RentCycleResponse[]> => {
  return await apiRequest<RentCycleResponse[]>(
    '/api/v1/finance/rent-cycles/batch-generate',
    {
      method: 'POST',
      body: JSON.stringify({ propertyId, billingMonth, dueDate }),
      token
    }
  );
};

export const getPreFlightChecklist = async (
  propertyId: string,
  billingMonth: string,
  token: string
): Promise<PreFlightChecklistResponse> => {
  return await apiRequest<PreFlightChecklistResponse>(
    `/api/v1/finance/rent-cycles/pre-flight?propertyId=${propertyId}&billingMonth=${billingMonth}`,
    {
      method: 'GET',
      token
    }
  );
};

export const listRentCycles = async (
  billingMonth: string,
  token: string
): Promise<RentCycleResponse[]> => {
  return await apiRequest<RentCycleResponse[]>(
    `/api/v1/finance/rent-cycles?billingMonth=${billingMonth}`,
    {
      method: 'GET',
      token
    }
  );
};

export const batchPublishRentCycle = async (
  propertyId: string,
  billingMonth: string,
  token: string
): Promise<RentCycleResponse[]> => {
  return await apiRequest<RentCycleResponse[]>(
    `/api/v1/finance/rent-cycles/batch-publish?propertyId=${propertyId}&billingMonth=${billingMonth}`,
    {
      method: 'POST',
      token
    }
  );
};
