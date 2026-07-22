import { apiRequest } from '@/src/api/client';

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  tenantId: string;
  leaseId: string;
  propertyId: string;
  unitId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTechnicianName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: string;
  priority?: string;
  propertyId: string;
  unitId: string;
  leaseId: string;
}

export interface TicketHealthStats {
  totalTickets: number;
  pendingCount: number;
  resolvedCount: number;
}

export function getMaintenanceTickets(token: string): Promise<MaintenanceTicket[]> {
  return apiRequest<any>('/api/v1/property/tenant/maintenance-tickets', {
    method: 'GET',
    token,
  }).then((res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  });
}

export function createMaintenanceTicket(token: string, data: CreateTicketRequest): Promise<MaintenanceTicket> {
  return apiRequest<MaintenanceTicket>('/api/v1/property/tenant/maintenance-tickets', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

export function getTicketHealthStats(token: string): Promise<TicketHealthStats> {
  return apiRequest<TicketHealthStats>('/api/v1/property/tenant/maintenance-tickets/health-stats', {
    method: 'GET',
    token,
  });
}
