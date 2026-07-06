package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.common.domain.LeaseStatus;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface LeaseQueryService {
    LeaseTbl getLeaseById(UUID id);
    boolean existsByUnitId(UUID unitId);
    Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status);
    List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status);
    List<LeaseTbl> findActiveLeasesByProperty(UUID propertyId);
    Map<UUID, List<LeaseTbl>> findActiveLeasesByUnitIds(Collection<UUID> unitIds);
    boolean existsByPropertyId(UUID propertyId);
}
