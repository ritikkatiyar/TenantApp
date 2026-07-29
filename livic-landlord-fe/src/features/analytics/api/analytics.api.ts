import { apiRequest } from '@/src/api/client';

export interface RevenueMetrics {
  expected: number;
  collected: number;
  collectionRate: number;
}

export interface ExpenseMetrics {
  totalExpenses: number;
  growthFromLastMonth: number;
}

export interface NetProfitMetrics {
  netProfit: number;
  growth: number;
}

export interface PortfolioOccupancy {
  propertyId: string;
  propertyName: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
}

export interface DefaulterList {
  tenantName: string;
  unitNumber: string;
  propertyName: string;
  daysOverdue: number;
  amountDue: number;
  rentCycleId: string;
}

export interface YieldAnalysis {
  propertyId: string;
  propertyName: string;
  netYield: number;
}

export interface LandlordAnalyticsDTO {
  revenue: RevenueMetrics;
  expenses: ExpenseMetrics;
  profit: NetProfitMetrics;
  occupancy: PortfolioOccupancy[];
  operationalOverhead: Record<string, number>;
  defaulters: DefaulterList[];
  yieldAnalysis: YieldAnalysis[];
}

export function getLandlordDashboard(
  token: string,
  billingMonth?: string
): Promise<LandlordAnalyticsDTO> {
  let url = '/api/v1/analytics/landlord/dashboard';
  if (billingMonth) {
    url += `?billingMonth=${billingMonth}`;
  }
  return apiRequest<LandlordAnalyticsDTO>(url, {
    method: 'GET',
    token,
  });
}
