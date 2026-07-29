package com.livic.finance.service.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.LeaseQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
public class LeaseQueryServiceImpl implements LeaseQueryService {

    private final LeaseCrudService leaseCrudService;

    @Override
    public LeaseTbl getLeaseById(UUID id) {
        return leaseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
    }

    @Override
    public boolean existsByUnitId(UUID unitId) {
        return leaseCrudService.existsByUnit_Id(unitId);
    }

    @Override
    public Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status) {
        return leaseCrudService.findByUserIdAndStatus(userId, status);
    }

    @Override
    public List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status) {
        return leaseCrudService.findByUnitIdAndStatus(unitId, status).stream().toList();
    }

    @Override
    public List<LeaseTbl> findActiveLeasesByProperty(UUID propertyId) {
        return leaseCrudService.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE).stream().toList();
    }

    @Override
    public Map<UUID, List<LeaseTbl>> findActiveLeasesByUnitIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) return Collections.emptyMap();
        return leaseCrudService.findByUnit_IdInAndStatus(unitIds, LeaseStatus.ACTIVE)
                .stream()
                .collect(Collectors.groupingBy(l -> l.getUnit().getId()));
    }

    @Override
    public boolean existsByPropertyId(UUID propertyId) {
        return leaseCrudService.existsByUnit_Property_Id(propertyId);
    }
}
