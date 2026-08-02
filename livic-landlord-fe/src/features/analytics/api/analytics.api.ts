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

export function getPortfolioOccupancy(token: string): Promise<PortfolioOccupancyResponse[]> {
  return apiRequest<PortfolioOccupancyResponse[]>('/api/v1/analytics/occupancy', { method: 'GET', token });
}

export function getDefaultersList(token: string): Promise<DefaulterResponse[]> {
  return apiRequest<DefaulterResponse[]>('/api/v1/analytics/defaulters', { method: 'GET', token });
}

export function getExpensesBreakdown(token: string, billingMonth?: string): Promise<ExpensesBreakdownResponse> {
  let url = '/api/v1/analytics/expenses-breakdown';
  if (billingMonth) {
    url += `?billingMonth=${billingMonth}`;
  }
  return apiRequest<ExpensesBreakdownResponse>(url, { method: 'GET', token });
}
