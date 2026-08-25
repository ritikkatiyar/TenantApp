import { apiRequest } from '@/src/api/client';

export interface BackendInventoryItem {
  id: string;
  propertyId: string;
  unitId?: string | null;
  name: string;
  category: string;
  location?: string | null;
  serialNumber?: string | null;
  modelNumber?: string | null;
  condition: string;
  status: string;
  nextService?: string | null;
  value?: number | null;
  shared: boolean;
  icon?: string | null;
  image?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface TenantVisibleInventoryResponse {
  unitItems: BackendInventoryItem[];
  sharedItems: BackendInventoryItem[];
}

export async function getTenantVisibleInventory(token: string, propertyId?: string): Promise<TenantVisibleInventoryResponse> {
  try {
    const url = propertyId ? `/api/v1/inventory/my-visible-items?propertyId=${propertyId}` : '/api/v1/inventory/my-visible-items';
    const data = await apiRequest<TenantVisibleInventoryResponse>(url, {
      method: 'GET',
      token,
    });
    return data || { unitItems: [], sharedItems: [] };
  } catch (err: any) {
    console.warn('[Inventory API] Failed to fetch tenant inventory:', err?.message);
    return { unitItems: [], sharedItems: [] };
  }
}
