package com.livic.finance.service.interfaces;

import com.livic.common.domain.LeaseStatus;
import com.livic.finance.domain.LeaseTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    Page<LeaseTbl> findActiveLeasesByProperty(UUID propertyId, Pageable pageable);
    Map<UUID, List<LeaseTbl>> findActiveLeasesByUnitIds(Collection<UUID> unitIds);
    boolean existsByPropertyId(UUID propertyId);
}
