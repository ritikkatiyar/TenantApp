package com.livic.analytics.service.interfaces;

import com.livic.analytics.dto.AnalyticsDTOs;

import java.util.List;
import java.util.UUID;

public interface AnalyticsService {

    AnalyticsDTOs.SummaryResponse getSummary(UUID landlordId, String billingMonth);

    List<AnalyticsDTOs.PortfolioOccupancyResponse> getOccupancy(UUID landlordId);

    List<AnalyticsDTOs.DefaulterResponse> getDefaulters(UUID landlordId);

    AnalyticsDTOs.ExpensesBreakdownResponse getExpensesBreakdown(UUID landlordId, String billingMonth);
}
