package com.livic.analytics.controller;

import com.livic.analytics.service.interfaces.AnalyticsService;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static com.livic.analytics.dto.AnalyticsDTOs.DefaulterResponse;
import static com.livic.analytics.dto.AnalyticsDTOs.ExpensesBreakdownResponse;
import static com.livic.analytics.dto.AnalyticsDTOs.PortfolioOccupancyResponse;
import static com.livic.analytics.dto.AnalyticsDTOs.SummaryResponse;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<SummaryResponse>> getSummary(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) String billingMonth
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        String month = resolveBillingMonth(billingMonth);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getSummary(userId, month)));
    }

    @GetMapping("/occupancy")
    public ResponseEntity<ApiResponse<List<PortfolioOccupancyResponse>>> getOccupancy(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getOccupancy(userId)));
    }

    @GetMapping("/defaulters")
    public ResponseEntity<ApiResponse<List<DefaulterResponse>>> getDefaulters(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDefaulters(userId)));
    }

    @GetMapping("/expenses-breakdown")
    public ResponseEntity<ApiResponse<ExpensesBreakdownResponse>> getExpensesBreakdown(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) String billingMonth
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        String month = resolveBillingMonth(billingMonth);
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getExpensesBreakdown(userId, month)));
    }

    private static String resolveBillingMonth(String billingMonth) {
        if (billingMonth == null || billingMonth.isBlank()) {
            LocalDate now = LocalDate.now();
            return String.format("%04d-%02d", now.getYear(), now.getMonthValue());
        }
        return billingMonth.trim();
    }
}
