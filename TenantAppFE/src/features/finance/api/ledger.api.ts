import { apiRequest } from '@/src/api/client';

export interface LedgerEntryResponse {
  id: string;
  unitName: string;
  tenantName: string;
  transactionType: 'INVOICE_GENERATED' | 'PAYMENT_RECEIVED' | 'LATE_FEE_APPLIED' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  balance: number;
  referenceId: string;
  description: string;
  createdAt: string;
}

export const getLedgerForProperty = async (
  propertyId: string,
  token: string
): Promise<LedgerEntryResponse[]> => {
  return await apiRequest<LedgerEntryResponse[]>(
    `/api/v1/finance/ledger?propertyId=${propertyId}`,
    {
      method: 'GET',
      token
    }
  );
};
