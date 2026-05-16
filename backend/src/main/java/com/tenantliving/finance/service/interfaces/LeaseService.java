package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LeaseDTOs;

import java.util.UUID;

public interface LeaseService {
    LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request);
    LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId);

    LeaseTbl getLeaseById(UUID id);

    boolean existsByUnitId(UUID unitId);
    java.util.List<LeaseTbl> findByUserIdAndStatus(UUID userId, com.tenantliving.common.domain.LeaseStatus status);
    java.util.Map<UUID, LeaseTbl> findActiveLeasesByUnitIds(java.util.Collection<UUID> unitIds);
}
