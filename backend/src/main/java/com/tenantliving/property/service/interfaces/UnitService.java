package com.tenantliving.property.service.interfaces;

import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.dto.UnitDTOs;

import java.util.List;
import java.util.UUID;

public interface UnitService {
    UnitTbl getUnitById(UUID id);

    List<UnitTbl> saveAll(List<UnitTbl> units);

    List<UnitDTOs.FloorSummaryResponse> getFloorSummaries(UUID propertyId, Integer throughFloor);

    List<UnitTbl> getUnitsByFloor(UUID propertyId, int floorNumber);

    List<UnitTbl> saveFloorLayout(UUID propertyId, int floorNumber, List<UnitDTOs.FloorLayoutUnitRequest> items);

    List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request);
}
