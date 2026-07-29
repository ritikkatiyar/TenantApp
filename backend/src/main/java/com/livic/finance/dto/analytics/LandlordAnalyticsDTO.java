package com.livic.finance.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LandlordAnalyticsDTO {

    private RevenueMetrics revenue;
    private ExpenseMetrics expenses;
    private NetProfitMetrics profit;
    private List<PortfolioOccupancy> occupancy;
    private Map<String, BigDecimal> operationalOverhead;
    private List<DefaulterList> defaulters;
    private List<YieldAnalysis> yieldAnalysis;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueMetrics {
        private BigDecimal expected;
        private BigDecimal collected;
        private BigDecimal collectionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseMetrics {
        private BigDecimal totalExpenses;
        private BigDecimal growthFromLastMonth; // Mocked for now
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NetProfitMetrics {
        private BigDecimal netProfit;
        private BigDecimal growth; // Mocked for now
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortfolioOccupancy {
        private String propertyId;
        private String propertyName;
        private int totalUnits;
        private int occupiedUnits;
        private BigDecimal occupancyRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DefaulterList {
        private String tenantName;
        private String unitNumber;
        private String propertyName;
        private int daysOverdue;
        private BigDecimal amountDue;
        private String rentCycleId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YieldAnalysis {
        private String propertyId;
        private String propertyName;
        private BigDecimal netYield; // Profit percentage vs total potential revenue
    }
}
