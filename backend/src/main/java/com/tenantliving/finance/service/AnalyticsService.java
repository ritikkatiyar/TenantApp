package com.tenantliving.finance.service;

import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.repository.MembershipRepository;
import com.tenantliving.finance.dto.analytics.LandlordAnalyticsDTO;
import com.tenantliving.finance.dto.analytics.LandlordAnalyticsDTO.*;
import com.tenantliving.finance.repository.AnalyticsRepository;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    public LandlordAnalyticsDTO getLandlordAnalytics(UUID landlordId, String billingMonth) {
        List<MembershipTbl> memberships = membershipRepository.findByUserId(landlordId);
        List<UUID> landlordPropertyIds = memberships.stream()
                .filter(m -> m.getRole() != null && ("PROPERTY_OWNER".equals(m.getRole().getCode()) || "PROPERTY_MANAGER".equals(m.getRole().getCode())))
                .filter(m -> m.getProperty() != null)
                .map(m -> m.getProperty().getId())
                .distinct()
                .collect(Collectors.toList());

        if (landlordPropertyIds.isEmpty()) {
            return buildEmptyAnalytics();
        }

        // 1. Revenue Metrics
        Object[] revenueObj = analyticsRepository.getRevenueMetrics(landlordPropertyIds, billingMonth);
        BigDecimal expected = revenueObj[0] != null ? (BigDecimal) revenueObj[0] : BigDecimal.ZERO;
        BigDecimal collected = revenueObj[1] != null ? (BigDecimal) revenueObj[1] : BigDecimal.ZERO;
        BigDecimal collectionRate = expected.compareTo(BigDecimal.ZERO) > 0 ? 
                collected.divide(expected, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO;

        RevenueMetrics revenue = RevenueMetrics.builder()
                .expected(expected)
                .collected(collected)
                .collectionRate(collectionRate)
                .build();

        // 2. Expenses and Operational Overhead
        BigDecimal totalExpenses = analyticsRepository.getTotalExpenses(landlordPropertyIds);
        ExpenseMetrics expenses = ExpenseMetrics.builder()
                .totalExpenses(totalExpenses)
                .growthFromLastMonth(BigDecimal.ZERO) // Mocked for phase 1
                .build();
        
        Map<String, BigDecimal> operationalOverhead = analyticsRepository.getOperationalOverhead(landlordPropertyIds);

        // 3. Profit
        NetProfitMetrics profit = NetProfitMetrics.builder()
                .netProfit(collected.subtract(totalExpenses))
                .growth(BigDecimal.ZERO) // Mocked
                .build();

        // 4. Occupancy
        List<Object[]> occupancyData = analyticsRepository.getOccupancyByProperty(landlordPropertyIds);
        List<PortfolioOccupancy> occupancyList = new ArrayList<>();
        List<YieldAnalysis> yieldList = new ArrayList<>();
        for (Object[] row : occupancyData) {
            String propId = row[0].toString();
            String propName = (String) row[1];
            int totalUnits = ((Number) row[2]).intValue();
            int occupiedUnits = ((Number) row[3]).intValue();
            BigDecimal occRate = totalUnits > 0 ? 
                    BigDecimal.valueOf(occupiedUnits).divide(BigDecimal.valueOf(totalUnits), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO;
            
            occupancyList.add(PortfolioOccupancy.builder()
                    .propertyId(propId)
                    .propertyName(propName)
                    .totalUnits(totalUnits)
                    .occupiedUnits(occupiedUnits)
                    .occupancyRate(occRate)
                    .build());

            // Add dummy yield based on occupancy for now (since we haven't done per-property P&L)
            yieldList.add(YieldAnalysis.builder()
                    .propertyId(propId)
                    .propertyName(propName)
                    .netYield(occRate.multiply(BigDecimal.valueOf(0.08))) // Mock calculation for yield
                    .build());
        }

        // 5. Defaulters
        List<Object[]> defaulterData = analyticsRepository.getDefaulters(landlordPropertyIds);
        List<DefaulterList> defaulterList = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (Object[] row : defaulterData) {
            UUID tenantId = (UUID) row[0];
            String unitNumber = (String) row[1];
            String propertyName = (String) row[2];
            LocalDate dueDate = (LocalDate) row[3];
            BigDecimal amountDue = (BigDecimal) row[4];
            String rentCycleId = row[5].toString();

            String tenantName = "Unknown";
            if (tenantId != null) {
                tenantName = userRepository.findById(tenantId)
                        .map(UserTbl::getFullName)
                        .orElse("Unknown");
            }
            
            long daysOverdue = dueDate.until(today).getDays();
            if (daysOverdue < 0) daysOverdue = 0;

            defaulterList.add(DefaulterList.builder()
                    .tenantName(tenantName)
                    .unitNumber(unitNumber)
                    .propertyName(propertyName)
                    .daysOverdue((int) daysOverdue)
                    .amountDue(amountDue)
                    .rentCycleId(rentCycleId)
                    .build());
        }

        return LandlordAnalyticsDTO.builder()
                .revenue(revenue)
                .expenses(expenses)
                .profit(profit)
                .occupancy(occupancyList)
                .operationalOverhead(operationalOverhead)
                .defaulters(defaulterList)
                .yieldAnalysis(yieldList)
                .build();
    }

    private LandlordAnalyticsDTO buildEmptyAnalytics() {
        return LandlordAnalyticsDTO.builder()
                .revenue(new RevenueMetrics(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO))
                .expenses(new ExpenseMetrics(BigDecimal.ZERO, BigDecimal.ZERO))
                .profit(new NetProfitMetrics(BigDecimal.ZERO, BigDecimal.ZERO))
                .occupancy(new ArrayList<>())
                .operationalOverhead(Map.of())
                .defaulters(new ArrayList<>())
                .yieldAnalysis(new ArrayList<>())
                .build();
    }
}
