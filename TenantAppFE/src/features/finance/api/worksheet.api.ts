import { apiRequest } from '@/src/api/client';

export interface WorksheetEntryResponse {
  id: string;
  unitId: string;
  unitName: string;
  tenantName: string;
  floor: number;
  enteredValue: number;
  isBilled: boolean;
}

export interface UnitEntry {
  unitId: string;
  enteredValue: number;
}

export interface WorksheetSaveRequest {
  propertyId: string;
  chargeConfigId: string;
  billingMonth: string;
  entries: UnitEntry[];
}

export const getOrCreateWorksheet = async (
  propertyId: string, 
  chargeConfigId: string, 
  billingMonth: string,
  token: string
): Promise<WorksheetEntryResponse[]> => {
  return apiRequest<WorksheetEntryResponse[]>(
    `/api/v1/finance/billing-worksheets?propertyId=${propertyId}&chargeConfigId=${chargeConfigId}&billingMonth=${billingMonth}`,
    {
      method: 'GET',
      token
    }
  );
};

export const batchSaveWorksheet = async (
  request: WorksheetSaveRequest,
  token: string
): Promise<void> => {
  return apiRequest<void>(
    '/api/v1/finance/billing-worksheets/batch-save',
    {
      method: 'POST',
      body: JSON.stringify(request),
      token
    }
  );
};
