package com.livic.property.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.property.domain.UnitTbl;

import java.util.List;
import java.util.UUID;

public interface UnitCrudService extends CrudService<UnitTbl, UUID> {
    List<UnitTbl> findByPropertyId(UUID propertyId);
    boolean existsByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber);
    List<UnitTbl> findByPropertyIdAndFloor(UUID propertyId, Integer floor);
    int findMaxFloorByPropertyId(UUID propertyId);
    long countByPropertyIdIn(List<UUID> propertyIds);
    void deleteByPropertyId(UUID propertyId);
}
