package com.tenantliving.property.service.interfaces;

import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.unit.domain.UnitTbl;

import java.util.List;
import java.util.UUID;

public interface PropertyService {
    PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID ownerId, UUID creatorId);
    PropertyTbl updateProperty(UUID propertyId, PropertyDTOs.UpdatePropertyRequest request);
    List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request);
}
