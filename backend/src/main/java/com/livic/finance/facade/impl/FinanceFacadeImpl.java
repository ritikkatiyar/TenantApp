package com.livic.finance.facade.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.ChargeConfigDTOs;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.facade.FinanceFacade;
import com.livic.finance.repository.LeaseRepository;
import com.livic.finance.service.ChargeConfigQueryService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceFacadeImpl implements FinanceFacade {

    private final LeaseRepository leaseRepository;
    private final LeaseQueryService leaseQueryService;
    private final LeaseCrudService leaseCrudService;
    private final RentCycleCrudService rentCycleCrudService;
    private final ChargeConfigQueryService chargeConfigQueryService;

    @Override
    public boolean isUnitOccupiedOnDate(UUID unitId, LocalDate date) {
        List<LeaseTbl> activeLeases = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
        return activeLeases.stream().anyMatch(lease -> {
            boolean hasMovedIn = !date.isBefore(lease.getMoveInDate());
            boolean hasNotMovedOut = lease.getMoveOutDate() == null || date.isBefore(lease.getMoveOutDate());
            return hasMovedIn && hasNotMovedOut;
        });
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
}
