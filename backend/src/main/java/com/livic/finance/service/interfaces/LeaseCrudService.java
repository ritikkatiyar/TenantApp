package com.livic.finance.service.interfaces;

import com.livic.common.domain.LeaseStatus;
import com.livic.common.service.interfaces.CrudService;
import com.livic.finance.domain.LeaseTbl;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaseCrudService extends CrudService<LeaseTbl, UUID> {
    Optional<LeaseTbl> findWithUnitAndPropertyById(UUID id);
    Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status);
    List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status);
    List<LeaseTbl> findActiveOccupanciesByProperty(UUID propertyId, LeaseStatus status);
    boolean existsByUnit_Id(UUID unitId);
    List<LeaseTbl> findByUnit_IdInAndStatus(Collection<UUID> unitIds, LeaseStatus status);
    boolean existsByUserIdAndPropertyIdAndStatus(UUID userId, UUID propertyId, LeaseStatus status);
    boolean existsByUnit_Property_Id(UUID propertyId);
}
