package com.livic.analytics.service.impl;

import com.livic.analytics.dto.AnalyticsDTOs;
import com.livic.analytics.service.interfaces.AnalyticsService;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;
import com.livic.finance.facade.FinanceFacade;
import com.livic.property.facade.PropertyFacade;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final FinanceFacade financeFacade;
    private final PropertyFacade propertyFacade;
    private final UserFacade userFacade;
    private final AuthFacade authFacade;

    private List<UUID> getLandlordPropertyIds(UUID landlordId) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(landlordId);
        return memberships.stream()
                .filter(m -> m.roleCode() != null && ("PROPERTY_OWNER".equals(m.roleCode()) || "PROPERTY_MANAGER".equals(m.roleCode())))
                .filter(m -> m.propertyId() != null)
                .map(MembershipSummaryDTO::propertyId)
                .distinct()
                .collect(Collectors.toList());
    }

    @Override
    public AnalyticsDTOs.SummaryResponse getSummary(UUID landlordId, String billingMonth) {
        List<UUID> propertyIds = getLandlordPropertyIds(landlordId);
        if (propertyIds.isEmpty()) {
            return new AnalyticsDTOs.SummaryResponse(
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
            );
        }

        FinanceFacade.RevenueMetricsDTO rev = financeFacade.getRevenueMetrics(propertyIds, billingMonth);
        BigDecimal expected = rev.expected();
        BigDecimal collected = rev.collected();
        BigDecimal collectionRate = expected.compareTo(BigDecimal.ZERO) > 0 ?
                collected.divide(expected, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO;

        BigDecimal totalExpenses = financeFacade.getTotalExpenses(propertyIds);
        BigDecimal netProfit = collected.subtract(totalExpenses);

        return new AnalyticsDTOs.SummaryResponse(
                expected,
                collected,
                collectionRate,
                totalExpenses,
                BigDecimal.ZERO,
                netProfit,
                BigDecimal.ZERO
        );
    }

    @Override
    public List<AnalyticsDTOs.PortfolioOccupancyResponse> getOccupancy(UUID landlordId) {
        List<UUID> propertyIds = getLandlordPropertyIds(landlordId);
        if (propertyIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<PropertyFacade.PropertyOccupancySummaryDTO> occupancyData = propertyFacade.getOccupancyByProperty(propertyIds);
        List<AnalyticsDTOs.PortfolioOccupancyResponse> list = new ArrayList<>();
        for (PropertyFacade.PropertyOccupancySummaryDTO row : occupancyData) {
            String propId = row.propertyId().toString();
            String propName = row.propertyName();
            int totalUnits = row.totalUnits();
            int occupiedUnits = row.occupiedUnits();
            BigDecimal occRate = totalUnits > 0 ?
                    BigDecimal.valueOf(occupiedUnits).divide(BigDecimal.valueOf(totalUnits), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO;
            BigDecimal netYield = occRate.multiply(BigDecimal.valueOf(0.08));

            list.add(new AnalyticsDTOs.PortfolioOccupancyResponse(
                    propId, propName, totalUnits, occupiedUnits, occRate, netYield
            ));
        }
        return list;
    }

    @Override
    public List<AnalyticsDTOs.DefaulterResponse> getDefaulters(UUID landlordId) {
        List<UUID> propertyIds = getLandlordPropertyIds(landlordId);
        if (propertyIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<FinanceFacade.DefaulterRecordDTO> defaulterData = financeFacade.getDefaulters(propertyIds);
        List<AnalyticsDTOs.DefaulterResponse> list = new ArrayList<>();
        LocalDate today = LocalDate.now();

        List<UUID> tenantIds = defaulterData.stream()
                .map(FinanceFacade.DefaulterRecordDTO::tenantId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, UserSummaryDTO> usersMap = userFacade.getUsersByIds(tenantIds);

        for (FinanceFacade.DefaulterRecordDTO row : defaulterData) {
            UUID tenantId = row.tenantId();
            String unitNumber = row.unitNumber();
            String propertyName = row.propertyName();
            LocalDate dueDate = row.dueDate();
            BigDecimal amountDue = row.amountDue();
            String rentCycleId = row.rentCycleId().toString();

            String tenantName = "Unknown";
            if (tenantId != null) {
                UserSummaryDTO user = usersMap.get(tenantId);
                if (user != null && user.fullName() != null) {
                    tenantName = user.fullName();
                }
            }

            long daysOverdue = dueDate.until(today).getDays();
            if (daysOverdue < 0) daysOverdue = 0;

            list.add(new AnalyticsDTOs.DefaulterResponse(
                    tenantName, unitNumber, propertyName, (int) daysOverdue, amountDue, rentCycleId
            ));
        }
        return list;
    }

    @Override
    public AnalyticsDTOs.ExpensesBreakdownResponse getExpensesBreakdown(UUID landlordId, String billingMonth) {
        List<UUID> propertyIds = getLandlordPropertyIds(landlordId);
        if (propertyIds.isEmpty()) {
            return new AnalyticsDTOs.ExpensesBreakdownResponse(BigDecimal.ZERO, BigDecimal.ZERO, Map.of());
        }

        BigDecimal totalExpenses = financeFacade.getTotalExpenses(propertyIds);
        Map<String, BigDecimal> overhead = financeFacade.getOperationalOverhead(propertyIds);

        return new AnalyticsDTOs.ExpensesBreakdownResponse(
                totalExpenses, BigDecimal.ZERO, overhead
        );
    }
}
