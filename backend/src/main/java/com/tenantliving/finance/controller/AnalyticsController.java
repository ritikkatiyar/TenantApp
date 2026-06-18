package com.tenantliving.finance.controller;

import com.tenantliving.auth.principal.UserDetailsImpl;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.tenantliving.finance.dto.analytics.LandlordAnalyticsDTO;
import com.tenantliving.finance.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/landlord/dashboard")
    public ResponseEntity<LandlordAnalyticsDTO> getLandlordDashboard(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) String billingMonth) {
        
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(currentUser.getId());
        
        if (billingMonth == null || billingMonth.isEmpty()) {
            // Default to current month, e.g., "2026-06"
            java.time.LocalDate now = java.time.LocalDate.now();
            billingMonth = String.format("%04d-%02d", now.getYear(), now.getMonthValue());
        }

        LandlordAnalyticsDTO dashboard = analyticsService.getLandlordAnalytics(userId, billingMonth);
        return ResponseEntity.ok(dashboard);
    }
}
