import { apiRequest } from '@/src/api/client';

export interface FloorSummaryResponse {
  floorNumber: number;
  displayLabel: string;
  configured: boolean;
  unitCount: number;
}

export function getFloorSummaries(propertyId: string, token: string, throughFloor?: number): Promise<FloorSummaryResponse[]> {
  const query = throughFloor !== undefined ? `?throughFloor=${throughFloor}` : '';
  const path = `/api/v1/properties/${propertyId}/floors${query}`;

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
  activeLeases?: ActiveLeaseSummary[];
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
  const path = `/api/v1/properties/${propertyId}/floors/${floorNumber}/layout`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'GET',
    token,
  });
}

export function getAllFloorsLayout(propertyId: string, token: string): Promise<UnitResponse[]> {
  const path = `/api/v1/properties/${propertyId}/floors/layouts`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'GET',
    token,
  });
}

export interface BatchUnitRequest {
  totalFloors: number;
  unitsPerFloor: number;
  startingFloorNumber: number;
  prefix: string;
  capacity: number;
  unitType: string;
}

export function generateBatchUnits(propertyId: string, request: BatchUnitRequest, token: string): Promise<UnitResponse[]> {
  const path = `/api/v1/properties/${propertyId}/units/batch`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'POST',
    token,
    body: JSON.stringify(request),
  });
}

export function saveFloorLayout(
  propertyId: string,
  floorNumber: number,
  token: string,
  layout: any[]
): Promise<UnitResponse[]> {
  const path = `/api/v1/properties/${propertyId}/floors/${floorNumber}/layout`;
  return apiRequest<UnitResponse[]>(path, {
    method: 'PUT',
    token,
    body: JSON.stringify(layout),
  });
}
