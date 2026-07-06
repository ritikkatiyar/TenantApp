package com.tenantliving.finance.service.impl;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.repository.LeaseRepository;
import com.tenantliving.finance.service.interfaces.LeaseQueryService;

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

    private final LeaseRepository leaseRepository;

    @Override
    public LeaseTbl getLeaseById(UUID id) {
        return leaseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
    }

    @Override
    public boolean existsByUnitId(UUID unitId) {
        return leaseRepository.existsByUnit_Id(unitId);
    }

    @Override
    public Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status) {
        return leaseRepository.findByUserIdAndStatus(userId, status);
    }

    @Override
    public List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status) {
        return leaseRepository.findByUnitIdAndStatus(unitId, status).stream().toList();
    }

    @Override
    public List<LeaseTbl> findActiveLeasesByProperty(UUID propertyId) {
        return leaseRepository.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE).stream().toList();
    }

    @Override
    public Map<UUID, List<LeaseTbl>> findActiveLeasesByUnitIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) return Collections.emptyMap();
        return leaseRepository.findByUnit_IdInAndStatus(unitIds, LeaseStatus.ACTIVE)
                .stream()
                .collect(Collectors.groupingBy(l -> l.getUnit().getId()));
    }

    @Override
    public boolean existsByPropertyId(UUID propertyId) {
        return leaseRepository.existsByUnit_Property_Id(propertyId);
    }
}
