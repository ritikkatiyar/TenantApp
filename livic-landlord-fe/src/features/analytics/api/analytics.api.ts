import { apiRequest } from '@/src/api/client';

export interface SummaryResponse {
  expectedRevenue: number;
  collectedRevenue: number;
  collectionRate: number;
  totalExpenses: number;
  expenseGrowthRate: number;
  netProfit: number;
  profitGrowthRate: number;
}

export interface PortfolioOccupancyResponse {
  propertyId: string;
  propertyName: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  netYield: number;
}

export interface DefaulterResponse {
  tenantName: string;
  unitNumber: string;
  propertyName: string;
  daysOverdue: number;
  amountDue: number;
  rentCycleId: string;
}

export interface ExpensesBreakdownResponse {
  totalExpenses: number;
  growthFromLastMonth: number;
  operationalOverhead: Record<string, number>;
}

export function getAnalyticsSummary(token: string, billingMonth?: string): Promise<SummaryResponse> {
  let url = '/api/v1/analytics/summary';
  if (billingMonth) {
    url += `?billingMonth=${billingMonth}`;
  }
  return apiRequest<SummaryResponse>(url, { method: 'GET', token });
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getPortfolioOccupancy(token: string, page = 0, size = 50): Promise<PortfolioOccupancyResponse[]> {
  const res = await apiRequest<PageResponse<PortfolioOccupancyResponse> | PortfolioOccupancyResponse[]>(
    `/api/v1/analytics/occupancy?page=${page}&size=${size}`,
    { method: 'GET', token }
  );
  if (Array.isArray(res)) return res;
  return res?.content ?? [];
}

export async function getDefaultersList(token: string, page = 0, size = 50): Promise<DefaulterResponse[]> {
  const res = await apiRequest<PageResponse<DefaulterResponse> | DefaulterResponse[]>(
    `/api/v1/analytics/defaulters?page=${page}&size=${size}`,
    { method: 'GET', token }
  );
  if (Array.isArray(res)) return res;
  return res?.content ?? [];
}

export function getExpensesBreakdown(token: string, billingMonth?: string): Promise<ExpensesBreakdownResponse> {
  let url = '/api/v1/analytics/expenses-breakdown';
  if (billingMonth) {
    url += `?billingMonth=${billingMonth}`;
  }
  return apiRequest<ExpensesBreakdownResponse>(url, { method: 'GET', token });
}
