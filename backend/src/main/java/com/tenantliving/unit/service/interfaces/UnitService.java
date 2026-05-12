package com.tenantliving.unit.service.interfaces;

import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.unit.domain.UnitTbl;
import com.tenantliving.unit.dto.UnitDTOs;

import java.util.List;
import java.util.UUID;

public interface UnitService {
    List<UnitTbl> saveAll(List<UnitTbl> units);

    List<UnitDTOs.FloorSummaryResponse> getFloorSummaries(UUID propertyId, Integer throughFloor);

    List<UnitDTOs.UnitResponse> getFloorLayout(UUID propertyId, int floorNumber);

    List<UnitDTOs.UnitResponse> saveFloorLayout(UUID propertyId, int floorNumber, List<UnitDTOs.FloorLayoutUnitRequest> items);

    List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request);
}
