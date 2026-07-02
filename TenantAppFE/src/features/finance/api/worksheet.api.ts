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
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/billing-worksheets?propertyId=${propertyId}&chargeConfigId=${chargeConfigId}&billingMonth=${billingMonth}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch worksheet');
  }

  const json = await response.json();
  return json.data;
};

export const batchSaveWorksheet = async (
  request: WorksheetSaveRequest,
  token: string
): Promise<void> => {
  const url = `${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/billing-worksheets/batch-save`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save worksheet');
  }
};
