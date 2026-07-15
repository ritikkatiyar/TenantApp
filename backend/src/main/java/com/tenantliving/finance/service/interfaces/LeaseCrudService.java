package com.tenantliving.finance.service.interfaces;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.service.interfaces.CrudService;
import com.tenantliving.finance.domain.LeaseTbl;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaseCrudService extends CrudService<LeaseTbl, UUID> {
    Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status);
    List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status);
    List<LeaseTbl> findActiveOccupanciesByProperty(UUID propertyId, LeaseStatus status);
    boolean existsByUnit_Id(UUID unitId);
    List<LeaseTbl> findByUnit_IdInAndStatus(Collection<UUID> unitIds, LeaseStatus status);
    boolean existsByUserIdAndPropertyIdAndStatus(UUID userId, UUID propertyId, LeaseStatus status);
    boolean existsByUnit_Property_Id(UUID propertyId);
}
