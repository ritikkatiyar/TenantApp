package com.tenantliving.property.service.interfaces;

import com.tenantliving.common.service.interfaces.CrudService;
import com.tenantliving.property.domain.UnitTbl;

import java.util.List;
import java.util.UUID;

public interface UnitCrudService extends CrudService<UnitTbl, UUID> {
    List<UnitTbl> findByPropertyId(UUID propertyId);
    boolean existsByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber);
    List<UnitTbl> findByPropertyIdAndFloor(UUID propertyId, Integer floor);
    int findMaxFloorByPropertyId(UUID propertyId);
    void deleteByPropertyId(UUID propertyId);
}
