package com.livic.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AnalyticsDTOs {

    public record SummaryResponse(
            BigDecimal expectedRevenue,
            BigDecimal collectedRevenue,
            BigDecimal collectionRate,
            BigDecimal totalExpenses,
            BigDecimal expenseGrowthRate,
            BigDecimal netProfit,
            BigDecimal profitGrowthRate
    ) {}

    public record PortfolioOccupancyResponse(
            String propertyId,
            String propertyName,
            int totalUnits,
            int occupiedUnits,
            BigDecimal occupancyRate,
            BigDecimal netYield
    ) {}

    public record DefaulterResponse(
            String tenantName,
            String unitNumber,
            String propertyName,
            int daysOverdue,
            BigDecimal amountDue,
            String rentCycleId
    ) {}

    public record ExpensesBreakdownResponse(
            BigDecimal totalExpenses,
            BigDecimal growthFromLastMonth,
            Map<String, BigDecimal> operationalOverhead
    ) {}
}
