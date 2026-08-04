package com.livic.finance.facade.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.finance.dto.ChargeConfigDTOs;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.facade.FinanceFacade;
import com.livic.finance.service.ChargeConfigQueryService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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
        return leaseQueryService.findActiveLeasesByUnitIds(unitIds);
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
        com.livic.finance.dto.RevenueMetricsDTO m = rentCycleCrudService.getRevenueMetrics(propertyIds, billingMonth);
        return new RevenueMetricsDTO(m.expected(), m.collected());
    }

    @Override
    public List<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds) {
        return getDefaulters(propertyIds, Pageable.unpaged()).getContent();
    }

    @Override
    public Page<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds, Pageable pageable) {
        Page<com.livic.finance.dto.DefaulterRecordDTO> page = rentCycleCrudService.getDefaulters(propertyIds, pageable);
        return page.map(d -> new DefaulterRecordDTO(d.tenantId(), d.unitNumber(), d.propertyName(), d.dueDate(), d.amountDue(), d.rentCycleId()));
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
