package com.tenantliving.property.service.interfaces;

import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.dto.UnitDTOs;

import java.util.List;
import java.util.UUID;

public interface UnitQueryService {
    UnitTbl getUnitById(UUID id);
    List<UnitDTOs.FloorSummaryResponse> getFloorSummaries(UUID propertyId, Integer throughFloor);
    List<UnitTbl> getUnitsByFloor(UUID propertyId, int floorNumber);
    List<UnitTbl> getUnitsByProperty(UUID propertyId);
    List<UnitTbl> getVacatingUnits(UUID propertyId);
}
