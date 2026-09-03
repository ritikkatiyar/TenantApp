package com.livic.analytics.service.interfaces;

import java.util.List;
import java.util.UUID;

import static com.livic.analytics.dto.AnalyticsDTOs.DefaulterResponse;
import static com.livic.analytics.dto.AnalyticsDTOs.ExpensesBreakdownResponse;
import static com.livic.analytics.dto.AnalyticsDTOs.PortfolioOccupancyResponse;
import static com.livic.analytics.dto.AnalyticsDTOs.SummaryResponse;

public interface AnalyticsService {

    SummaryResponse getSummary(UUID landlordId, String billingMonth);

    List<PortfolioOccupancyResponse> getOccupancy(UUID landlordId);

    List<DefaulterResponse> getDefaulters(UUID landlordId);

    ExpensesBreakdownResponse getExpensesBreakdown(UUID landlordId, String billingMonth);
}
