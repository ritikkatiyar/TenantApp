package com.livic.finance.facade.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.ChargeConfigDTOs;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.dto.RentCycleDashboardDTOs;
import com.livic.finance.facade.FinanceFacade;
import com.livic.finance.service.ChargeConfigQueryService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceFacadeImpl implements FinanceFacade {

    private final LeaseQueryService leaseQueryService;
    private final LeaseCrudService leaseCrudService;
    private final RentCycleCrudService rentCycleCrudService;
    private final ChargeConfigQueryService chargeConfigQueryService;

    @Override
    public boolean isUnitOccupiedOnDate(UUID unitId, LocalDate date) {
        return leaseCrudService.existsActiveLeaseOnDate(unitId, LeaseStatus.ACTIVE, date);
    }

    @Override
    public Optional<LeaseSummaryDTO> getActiveLeaseForUser(UUID userId) {
        return leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(LeaseSummaryDTO::from);
    }

    @Override
    public List<LeaseSummaryDTO> getActiveLeasesByPropertyId(UUID propertyId) {
        return leaseQueryService.findActiveLeasesByProperty(propertyId).stream()
                .map(LeaseSummaryDTO::from)
                .toList();
    }

    @Override
    public List<LeaseSummaryDTO> getActiveLeasesByUnitId(UUID unitId) {
        return leaseQueryService.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE).stream()
                .map(LeaseSummaryDTO::from)
                .toList();
    }

    @Override
    public Map<UUID, List<LeaseSummaryDTO>> getActiveLeasesByUnitIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, List<LeaseTbl>> map = leaseQueryService.findActiveLeasesByUnitIds(unitIds);
        return map.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream().map(LeaseSummaryDTO::from).toList()
                ));
    }

    @Override
    public boolean hasLeasesForProperty(UUID propertyId) {
        return leaseQueryService.existsByPropertyId(propertyId);
    }

    @Override
    public boolean hasLeasesForUnit(UUID unitId) {
        return leaseQueryService.existsByUnitId(unitId);
    }

    @Override
    public Optional<LeaseSummaryDTO> getLeaseById(UUID leaseId) {
        return leaseCrudService.findById(leaseId)
                .map(LeaseSummaryDTO::from);
    }

    @Override
    public Optional<UUID> getPropertyIdByRentCycleId(UUID rentCycleId) {
        return rentCycleCrudService.findById(rentCycleId)
                .map(r -> r.getLease().getUnit().getProperty().getId());
    }

    @Override
    public ChargeConfigDTOs.ChargeConfigResponse getChargeConfigById(UUID chargeConfigId) {
        return chargeConfigQueryService.getChargeConfigById(chargeConfigId);
    }

    @Override
    public RevenueMetricsDTO getRevenueMetrics(List<UUID> propertyIds, String billingMonth) {
        RentCycleDashboardDTOs.RevenueMetricsDTO metrics = rentCycleCrudService.getRevenueMetrics(propertyIds, billingMonth);
        return new RevenueMetricsDTO(metrics.expected(), metrics.collected());
    }

    @Override
    public List<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds) {
        List<RentCycleDashboardDTOs.DefaulterRecordDTO> defaulters = rentCycleCrudService.getDefaulters(propertyIds);
        return defaulters.stream()
                .map(d -> new DefaulterRecordDTO(d.tenantId(), d.unitNumber(), d.propertyName(), d.dueDate(), d.amountDue(), d.rentCycleId()))
                .toList();
    }

    @Override
    public BigDecimal getTotalExpenses(List<UUID> propertyIds) {
        return BigDecimal.ZERO;
    }

    @Override
    public Map<String, BigDecimal> getOperationalOverhead(List<UUID> propertyIds) {
        return Collections.emptyMap();
    }
}
