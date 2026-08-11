import { apiRequest } from '@/src/api/client';

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  tenantId?: string | null;
  leaseId?: string | null;
  propertyId: string;
  unitId?: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  scope: string;
  escalationStatus: string;
  escalationLevel: number;
  assignedContactName: string;
  assignedContactPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: string;
  priority?: string;
  propertyId: string;
  unitId?: string | null;
  leaseId?: string | null;
  scope?: string;
  assignedContactName?: string;
  assignedContactPhone?: string;
}

export interface TicketHealthStats {
  totalTickets: number;
  pendingCount: number;
  resolvedCount: number;
}

export function getMaintenanceTickets(token: string): Promise<MaintenanceTicket[]> {
  return apiRequest<any>('/api/v1/issues', {
    method: 'GET',
    token,
  }).then((res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.content)) return res.content;
    return [];
  });
}

export function createMaintenanceTicket(token: string, data: CreateTicketRequest): Promise<MaintenanceTicket> {
  const payload = {
    ...data,
    scope: data.scope || 'UNIT',
    assignedContactName: data.assignedContactName || 'Tenant Support',
    assignedContactPhone: data.assignedContactPhone || '',
    priority: data.priority || 'STANDARD',
  };
  return apiRequest<MaintenanceTicket>('/api/v1/issues', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function getTicketHealthStats(token: string): Promise<TicketHealthStats> {
  return apiRequest<any>('/api/v1/issues', {
    method: 'GET',
    token,
  }).then((res) => {
    const tickets = Array.isArray(res) ? res : (res && Array.isArray(res.content) ? res.content : []);
    const totalTickets = tickets.length;
    const pendingCount = tickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'PENDING').length;
    const resolvedCount = tickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    return {
      totalTickets,
      pendingCount,
      resolvedCount,
    };
  });
}
