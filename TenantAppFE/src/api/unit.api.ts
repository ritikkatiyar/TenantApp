import { apiRequest } from './client';

export interface FloorSummaryResponse {
  floorNumber: number;
  displayLabel: string;
  configured: boolean;
  unitCount: number;
}

export function getFloorSummaries(propertyId: string, token: string, throughFloor?: number): Promise<FloorSummaryResponse[]> {
  const query = throughFloor !== undefined ? `?throughFloor=${throughFloor}` : '';
  const path = `/api/v1/property/properties/${propertyId}/floors${query}`;

  return apiRequest<FloorSummaryResponse[]>(path, {
    method: 'GET',
    token,
  });
}

export interface UnitResponse {
  id: string;
  unitNumber: string;
  floor: number;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  type: string;
  capacity: number;
  facing: string;
  activeLease?: ActiveLeaseSummary | null;
}

export interface ActiveLeaseSummary {
  leaseId: string;
  tenantUserId: string;
  tenantName?: string | null;
  tenantPhone?: string | null;
  rentAmount: number;
  status: string;
}

export function getFloorLayout(propertyId: string, floorNumber: number, token: string): Promise<UnitResponse[]> {
  const path = `/api/v1/property/properties/${propertyId}/floors/${floorNumber}/layout`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'GET',
    token,
  });
}
